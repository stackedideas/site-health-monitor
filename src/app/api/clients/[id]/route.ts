import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UpdateClientRequest } from '@/lib/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUSES = ['active', 'maintenance', 'paused', 'complete'];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('[GET /api/clients/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateClientRequest = await request.json();

    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }
    if (body.name && body.name.trim().length > 100) {
      return NextResponse.json({ error: 'Name must be 100 characters or fewer' }, { status: 400 });
    }
    if (body.contact_email && !EMAIL_RE.test(body.contact_email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }
    if (body.monthly_retainer !== undefined && body.monthly_retainer < 0) {
      return NextResponse.json({ error: 'Monthly retainer must be a positive number' }, { status: 400 });
    }
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.contact_name !== undefined) updates.contact_name = body.contact_name?.trim() || null;
    if (body.contact_email !== undefined) updates.contact_email = body.contact_email?.trim() || null;
    if (body.contract_start !== undefined) updates.contract_start = body.contract_start || null;
    if (body.monthly_retainer !== undefined) updates.monthly_retainer = body.monthly_retainer;
    if (body.status !== undefined) updates.status = body.status;
    if (body.notes !== undefined) updates.notes = body.notes?.trim() || null;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[PUT /api/clients/[id]]', err);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { error } = await supabase.from('clients').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/clients/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
