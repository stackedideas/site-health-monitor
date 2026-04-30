import { Badge } from '@/components/ui/badge';
import type { Site, HealthCheck } from '@/lib/types';

interface OverviewTabProps {
  site: Site;
  checks: HealthCheck[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function calculateUptime(checks: HealthCheck[]): string {
  if (checks.length === 0) return 'N/A';
  const healthy = checks.filter((c) => c.status === 'healthy').length;
  return `${((healthy / checks.length) * 100).toFixed(1)}%`;
}

function averageResponseTime(checks: HealthCheck[]): string {
  const withTime = checks.filter((c) => c.response_time_ms !== null);
  if (withTime.length === 0) return 'N/A';
  const avg = withTime.reduce((sum, c) => sum + (c.response_time_ms || 0), 0) / withTime.length;
  return `${Math.round(avg)}ms`;
}

export function OverviewTab({ site, checks }: OverviewTabProps) {
  const latestCheck = checks[0];

  return (
    <div className="space-y-6">
      {/* Metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-sm text-text-secondary mb-1">Status</p>
          <Badge status={site.current_status} />
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-sm text-text-secondary mb-1">Response Time</p>
          <p className="text-xl font-semibold text-foreground">
            {latestCheck?.response_time_ms ? `${latestCheck.response_time_ms}ms` : 'N/A'}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-sm text-text-secondary mb-1">Uptime</p>
          <p className="text-xl font-semibold text-foreground">{calculateUptime(checks)}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-sm text-text-secondary mb-1">Avg Response</p>
          <p className="text-xl font-semibold text-foreground">{averageResponseTime(checks)}</p>
        </div>
      </div>

      {/* Recent checks table */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Recent Checks</h3>
        {checks.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <p className="text-text-secondary">No health checks yet. Run your first check.</p>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">Time</th>
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">Status Code</th>
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">Response Time</th>
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">Error</th>
                </tr>
              </thead>
              <tbody>
                {checks.slice(0, 20).map((check) => (
                  <tr key={check.id} className="border-b border-border last:border-0 hover:bg-surface-hover/50">
                    <td className="px-4 py-3 text-sm text-foreground">{formatDate(check.checked_at)}</td>
                    <td className="px-4 py-3">
                      <Badge status={check.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground font-mono">
                      {check.status_code || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {check.response_time_ms ? `${check.response_time_ms}ms` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-danger truncate max-w-[200px]">
                      {check.error_message || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
