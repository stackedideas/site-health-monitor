import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('health_checks')
      .select('*')
      .eq('site_id', siteId)
      .order('checked_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error('Failed to fetch health checks:', err);
    return NextResponse.json({ error: 'Failed to fetch health checks' }, { status: 500 });
  }
}
