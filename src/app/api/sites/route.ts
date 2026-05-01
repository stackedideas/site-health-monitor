import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CreateSiteRequest } from '@/lib/types';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error('Failed to fetch sites:', err);
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateSiteRequest = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!body.url?.trim()) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(body.url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('sites')
      .insert({
        name: body.name.trim(),
        url: body.url.trim(),
        description: body.description?.trim() || null,
        github_repo: body.github_repo?.trim() || null,
        check_interval_minutes: body.check_interval_minutes || 5,
        client_id: body.client_id || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Failed to create site:', err);
    return NextResponse.json({ error: 'Failed to create site' }, { status: 500 });
  }
}
