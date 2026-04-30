import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchDependabotAlerts } from '@/lib/github-audit';

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('[cron/audit-dependencies] GITHUB_TOKEN is not set');
    return NextResponse.json({ error: 'GITHUB_TOKEN not configured' }, { status: 503 });
  }

  try {
    const supabase = await createClient();

    const { data: sites, error } = await supabase
      .from('sites')
      .select('id, name, github_repo')
      .eq('is_active', true)
      .not('github_repo', 'is', null);

    if (error) {
      console.error('[cron/audit-dependencies] Failed to fetch sites:', error);
      return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
    }

    const results = await Promise.allSettled(
      (sites ?? []).map(async (site) => {
        const vulnerabilities = await fetchDependabotAlerts(site.github_repo!, token);

        await supabase.from('dependencies').delete().eq('site_id', site.id);

        if (vulnerabilities.length > 0) {
          await supabase.from('dependencies').insert(
            vulnerabilities.map((v) => ({ ...v, site_id: site.id }))
          );
        }

        return { site: site.name, count: vulnerabilities.length };
      })
    );

    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(
          `[cron/audit-dependencies] Audit failed for site ${(sites ?? [])[i]?.name}:`,
          r.reason
        );
      }
    });

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({ audited: succeeded, failed, total: (sites ?? []).length });
  } catch (err) {
    console.error('[cron/audit-dependencies] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
