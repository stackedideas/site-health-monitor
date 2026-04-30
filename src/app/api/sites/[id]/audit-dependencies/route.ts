import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchDependabotAlerts } from '@/lib/github-audit';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: 'GITHUB_TOKEN is not configured on this server.' },
        { status: 503 }
      );
    }

    const supabase = await createClient();

    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, name, github_repo')
      .eq('id', id)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    if (!site.github_repo) {
      return NextResponse.json(
        { error: 'No GitHub repo configured for this site. Add one in the site settings.' },
        { status: 422 }
      );
    }

    const vulnerabilities = await fetchDependabotAlerts(site.github_repo, token);

    // Clear existing rows and replace with fresh audit results
    await supabase.from('dependencies').delete().eq('site_id', id);

    if (vulnerabilities.length > 0) {
      const { error: insertError } = await supabase.from('dependencies').insert(
        vulnerabilities.map((v) => ({ ...v, site_id: id }))
      );
      if (insertError) {
        console.error(`[audit-dependencies] Insert failed for site ${id}:`, insertError);
        return NextResponse.json({ error: 'Failed to save audit results' }, { status: 500 });
      }
    }

    return NextResponse.json({ count: vulnerabilities.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Audit failed';
    console.error('[audit-dependencies] Error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
