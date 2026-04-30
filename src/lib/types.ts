export type SiteStatus = 'healthy' | 'degraded' | 'down' | 'unknown';
export type CheckStatus = 'healthy' | 'degraded' | 'down';
export type AlertType = 'down' | 'degraded' | 'recovered';
export type DependencyType = 'api' | 'database' | 'cdn' | 'dns' | 'other';

export interface Site {
  id: string;
  name: string;
  url: string;
  description: string | null;
  github_repo: string | null;
  check_interval_minutes: number;
  is_active: boolean;
  current_status: SiteStatus;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthCheck {
  id: string;
  site_id: string;
  check_type: string;
  status: CheckStatus;
  status_code: number | null;
  response_time_ms: number | null;
  error_message: string | null;
  details: Record<string, unknown> | null;
  checked_at: string;
}

export interface Alert {
  id: string;
  site_id: string;
  alert_type: AlertType;
  message: string;
  is_acknowledged: boolean;
  sent_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface Dependency {
  id: string;
  site_id: string;
  package_name: string;
  current_version: string | null;
  latest_version: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low' | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSiteRequest {
  name: string;
  url: string;
  description?: string;
  github_repo?: string;
  check_interval_minutes?: number;
}

export interface UpdateSiteRequest {
  name?: string;
  url?: string;
  description?: string;
  github_repo?: string;
  check_interval_minutes?: number;
  is_active?: boolean;
}

export interface HealthCheckResult {
  status: CheckStatus;
  status_code: number | null;
  response_time_ms: number | null;
  error_message: string | null;
}
