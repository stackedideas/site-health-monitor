export const HEALTH_CHECK_TIMEOUT_MS = 30_000;

export const STATUS_THRESHOLDS = {
  HEALTHY_MAX_MS: 1000,
  DEGRADED_MAX_MS: 5000,
} as const;

export const DEFAULT_CHECK_INTERVAL = 5;

export const SESSION_COOKIE_NAME = 'shm-session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds
