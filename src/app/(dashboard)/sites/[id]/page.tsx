import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SiteDetailClient } from './site-detail-client';
import type { Site, HealthCheck } from '@/lib/types';

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [siteResult, checksResult] = await Promise.all([
    supabase.from('sites').select('*').eq('id', id).single(),
    supabase
      .from('health_checks')
      .select('*')
      .eq('site_id', id)
      .order('checked_at', { ascending: false })
      .limit(50),
  ]);

  if (siteResult.error || !siteResult.data) {
    notFound();
  }

  return (
    <SiteDetailClient
      site={siteResult.data as Site}
      checks={(checksResult.data as HealthCheck[]) || []}
    />
  );
}
