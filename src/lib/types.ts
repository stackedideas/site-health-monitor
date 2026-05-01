export type SiteStatus = 'healthy' | 'degraded' | 'down' | 'unknown';
export type ClientStatus = 'active' | 'maintenance' | 'paused' | 'complete';

export interface Client {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contract_start: string | null;
  monthly_retainer: number | null;
  status: ClientStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
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
  client_id: string | null;
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

export interface DependencyDetails {
  summary: string;
  description: string;
  cve_id: string | null;
  ghsa_id: string;
  ghsa_url: string;
  cvss_score: number | null;
  references: string[];
}

export interface Dependency {
  id: string;
  site_id: string;
  package_name: string;
  current_version: string | null;
  latest_version: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low' | null;
  details: DependencyDetails | null;
  created_at: string;
  updated_at: string;
}

export interface CreateClientRequest {
  name: string;
  contact_name?: string;
  contact_email?: string;
  contract_start?: string;
  monthly_retainer?: number;
  status?: ClientStatus;
  notes?: string;
}

export interface UpdateClientRequest {
  name?: string;
  contact_name?: string;
  contact_email?: string;
  contract_start?: string;
  monthly_retainer?: number;
  status?: ClientStatus;
  notes?: string;
}

export interface CreateSiteRequest {
  name: string;
  url: string;
  description?: string;
  github_repo?: string;
  check_interval_minutes?: number;
  client_id?: string | null;
}

export interface UpdateSiteRequest {
  name?: string;
  url?: string;
  description?: string;
  github_repo?: string;
  check_interval_minutes?: number;
  is_active?: boolean;
  client_id?: string | null;
}

export interface HealthCheckResult {
  status: CheckStatus;
  status_code: number | null;
  response_time_ms: number | null;
  error_message: string | null;
}
