import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './dashboard-client';
import type { Site, Client } from '@/lib/types';

export type SiteWithClient = Site & {
  clients: Pick<Client, 'id' | 'name' | 'status'> | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: sites, error } = await supabase
    .from('sites')
    .select('*, clients(id, name, status)')
    .order('name');

  if (error) {
    console.error('Failed to fetch sites:', {
      message: (error as { message?: string }).message,
      code: (error as { code?: string }).code,
      details: (error as { details?: string }).details,
    });
  }

  return <DashboardClient sites={(sites as SiteWithClient[]) ?? []} />;
}
