import { HEALTH_CHECK_TIMEOUT_MS, STATUS_THRESHOLDS } from './constants';
import type { HealthCheckResult, CheckStatus } from './types';

function determineStatus(statusCode: number, responseTimeMs: number): CheckStatus {
  if (statusCode >= 500) return 'down';
  if (statusCode >= 400) return 'down';
  if (responseTimeMs > STATUS_THRESHOLDS.DEGRADED_MAX_MS) return 'degraded';
  if (responseTimeMs > STATUS_THRESHOLDS.HEALTHY_MAX_MS) return 'degraded';
  return 'healthy';
}

export async function performHealthCheck(url: string): Promise<HealthCheckResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'SiteHealthMonitor/1.0',
      },
    });

    const responseTimeMs = Date.now() - startTime;
    const status = determineStatus(response.status, responseTimeMs);

    return {
      status,
      status_code: response.status,
      response_time_ms: responseTimeMs,
      error_message: status === 'down' ? `HTTP ${response.status} ${response.statusText}` : null,
    };
  } catch (err) {
    const responseTimeMs = Date.now() - startTime;
    const error = err instanceof Error ? err : new Error(String(err));

    let errorMessage = error.message;
    if (error.name === 'AbortError') {
      errorMessage = `Request timed out after ${HEALTH_CHECK_TIMEOUT_MS / 1000}s`;
    }

    return {
      status: 'down',
      status_code: null,
      response_time_ms: responseTimeMs,
      error_message: errorMessage,
    };
  } finally {
    clearTimeout(timeout);
  }
}
