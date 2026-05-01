import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ClientDetailClient } from './client-detail-client';
import type { Client, Site } from '@/lib/types';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: client, error }, { data: sites }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('sites').select('*').eq('client_id', id).order('name'),
  ]);

  if (error || !client) notFound();

  return <ClientDetailClient client={client as Client} sites={(sites as Site[]) ?? []} />;
}
