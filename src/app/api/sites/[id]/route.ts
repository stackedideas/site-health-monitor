import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UpdateSiteRequest } from '@/lib/types';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateSiteRequest = await request.json();

    if (body.url) {
      try {
        new URL(body.url);
      } catch {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
      }
    }

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.url !== undefined) updates.url = body.url.trim();
    if (body.description !== undefined) updates.description = body.description?.trim() || null;
    if (body.github_repo !== undefined) updates.github_repo = body.github_repo?.trim() || null;
    if (body.check_interval_minutes !== undefined) updates.check_interval_minutes = body.check_interval_minutes;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('sites')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

    return NextResponse.json(data);
  } catch (err) {
    console.error('Failed to update site:', err);
    return NextResponse.json({ error: 'Failed to update site' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { error } = await supabase.from('sites').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete site:', err);
    return NextResponse.json({ error: 'Failed to delete site' }, { status: 500 });
  }
}
