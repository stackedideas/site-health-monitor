import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { healthCheckLimiter } from '@/lib/rate-limit';
import { runSiteCheck } from '@/lib/run-site-check';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;

    const { allowed } = healthCheckLimiter.check(siteId);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many checks. Please wait before trying again.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();

    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const { check, result } = await runSiteCheck(site, supabase);

    return NextResponse.json(check || result);
  } catch (err) {
    console.error('Health check failed:', err);
    return NextResponse.json({ error: 'Health check failed' }, { status: 500 });
  }
}
