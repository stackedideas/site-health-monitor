import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CreateClientRequest } from '@/lib/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('clients')
      .select('*, sites(count)')
      .order('name');

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error('[GET /api/clients]', err);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateClientRequest = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (body.name.trim().length > 100) {
      return NextResponse.json({ error: 'Name must be 100 characters or fewer' }, { status: 400 });
    }
    if (body.contact_email && !EMAIL_RE.test(body.contact_email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }
    if (body.monthly_retainer !== undefined && body.monthly_retainer < 0) {
      return NextResponse.json({ error: 'Monthly retainer must be a positive number' }, { status: 400 });
    }

    const validStatuses = ['active', 'maintenance', 'paused', 'complete'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: body.name.trim(),
        contact_name: body.contact_name?.trim() || null,
        contact_email: body.contact_email?.trim() || null,
        contract_start: body.contract_start || null,
        monthly_retainer: body.monthly_retainer ?? null,
        status: body.status ?? 'active',
        notes: body.notes?.trim() || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('[POST /api/clients]', err);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
