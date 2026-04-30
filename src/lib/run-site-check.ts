import type { SupabaseClient } from '@supabase/supabase-js';
import { performHealthCheck } from './health-check';
import type { Site } from './types';

export async function runSiteCheck(site: Site, supabase: SupabaseClient) {
  const result = await performHealthCheck(site.url);
  const previousStatus = site.current_status;

  const { data: check, error: checkError } = await supabase
    .from('health_checks')
    .insert({
      site_id: site.id,
      check_type: 'http',
      status: result.status,
      status_code: result.status_code,
      response_time_ms: result.response_time_ms,
      error_message: result.error_message,
    })
    .select()
    .single();

  if (checkError) {
    console.error(`[runSiteCheck] Failed to store check for site ${site.id}:`, checkError);
  }

  await supabase
    .from('sites')
    .update({
      current_status: result.status,
      last_checked_at: new Date().toISOString(),
    })
    .eq('id', site.id);

  if (previousStatus !== 'unknown' && previousStatus !== result.status) {
    let alertType: string;
    let message: string;

    if (result.status === 'down') {
      alertType = 'down';
      message = `${site.name} is down. ${result.error_message || `HTTP ${result.status_code}`}`;
    } else if (result.status === 'degraded') {
      alertType = 'degraded';
      message = `${site.name} is degraded. Response time: ${result.response_time_ms}ms`;
    } else {
      alertType = 'recovered';
      message = `${site.name} has recovered. Response time: ${result.response_time_ms}ms`;
    }

    await supabase.from('alerts').insert({
      site_id: site.id,
      alert_type: alertType,
      message,
    });
  }

  return { check: check ?? null, result };
}
