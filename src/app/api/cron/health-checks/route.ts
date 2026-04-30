import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runSiteCheck } from '@/lib/run-site-check';

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

  try {
    const supabase = await createClient();

    const { data: sites, error } = await supabase
      .from('sites')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('[cron/health-checks] Failed to fetch sites:', error);
      return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
    }

    const now = Date.now();
    const due = (sites ?? []).filter((site) => {
      if (!site.last_checked_at) return true;
      const lastChecked = new Date(site.last_checked_at).getTime();
      return now - lastChecked >= site.check_interval_minutes * 60 * 1000;
    });

    if (due.length === 0) {
      return NextResponse.json({ checked: 0 });
    }

    const results = await Promise.allSettled(
      due.map((site) => runSiteCheck(site, supabase))
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    if (failed > 0) {
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(`[cron/health-checks] Check failed for site ${due[i].id}:`, r.reason);
        }
      });
    }

    return NextResponse.json({ checked: succeeded, failed, total: due.length });
  } catch (err) {
    console.error('[cron/health-checks] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
