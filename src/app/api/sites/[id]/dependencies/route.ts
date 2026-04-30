import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('dependencies')
      .select('*')
      .eq('site_id', id)
      .order('severity', { ascending: true })
      .order('package_name', { ascending: true });

    if (error) {
      console.error(`[dependencies] Fetch failed for site ${id}:`, error);
      return NextResponse.json({ error: 'Failed to fetch dependencies' }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error('[dependencies] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
