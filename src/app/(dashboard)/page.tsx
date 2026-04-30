import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './dashboard-client';
import type { Site } from '@/lib/types';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: sites, error } = await supabase
    .from('sites')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    // Log properties explicitly — Supabase PostgrestError is a class instance
    // whose properties are non-enumerable and serialize as {} in Next.js dev tools.
    console.error('Failed to fetch sites:', {
      message: (error as { message?: string }).message,
      code: (error as { code?: string }).code,
      details: (error as { details?: string }).details,
      hint: (error as { hint?: string }).hint,
    });
  }

  return <DashboardClient sites={(sites as Site[]) || []} />;
}
