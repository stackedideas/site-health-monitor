'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import type { Site, Dependency, DependencyDetails } from '@/lib/types';

interface DependenciesTabProps {
  site: Site;
}

type KnownSeverity = NonNullable<Dependency['severity']>;

const SEVERITY_ORDER: KnownSeverity[] = ['critical', 'high', 'medium', 'low'];

const severityConfig: Record<
  KnownSeverity,
  { label: string; dot: string; bg: string; text: string; border: string }
> = {
  critical: {
    label: 'Critical',
    dot: 'bg-[#f87171]',
    bg: 'bg-[#f87171]/10',
    text: 'text-[#f87171]',
    border: 'border-[#f87171]/20',
  },
  high: {
    label: 'High',
    dot: 'bg-warning',
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/20',
  },
  medium: {
    label: 'Medium',
    dot: 'bg-[#fb923c]',
    bg: 'bg-[#fb923c]/10',
    text: 'text-[#fb923c]',
    border: 'border-[#fb923c]/20',
  },
  low: {
    label: 'Low',
    dot: 'bg-text-secondary',
    bg: 'bg-surface-hover',
    text: 'text-text-secondary',
    border: 'border-border',
  },
};

function SeverityBadge({ severity }: { severity: KnownSeverity }) {
  const cfg = severityConfig[severity];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function groupBySeverity(
  deps: Dependency[]
): Array<{ severity: KnownSeverity; items: Dependency[] }> {
  const map = new Map<KnownSeverity, Dependency[]>();
  for (const dep of deps) {
    const s = dep.severity as KnownSeverity | null;
    if (!s) continue;
    const list = map.get(s) ?? [];
    list.push(dep);
    map.set(s, list);
  }
  return SEVERITY_ORDER.filter((s) => map.has(s)).map((s) => ({
    severity: s,
    items: map.get(s)!,
  }));
}

function VulnerabilityModal({
  dep,
  onClose,
}: {
  dep: Dependency;
  onClose: () => void;
}) {
  const d = dep.details as DependencyDetails | null;
  const severity = dep.severity as KnownSeverity;
  const cfg = severityConfig[severity];

  return (
    <Dialog open onClose={onClose} title={dep.package_name}>
      <div className="space-y-4">
        {/* Severity + IDs */}
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={severity} />
          {d?.cve_id && (
            <span className="text-xs font-mono bg-surface-hover text-text-secondary px-2 py-0.5 rounded-full">
              {d.cve_id}
            </span>
          )}
          {d?.cvss_score != null && (
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
              CVSS {d.cvss_score.toFixed(1)}
            </span>
          )}
        </div>

        {/* Summary */}
        {d?.summary && (
          <p className="text-sm text-foreground font-medium">{d.summary}</p>
        )}

        {/* Affected / Fix version */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-hover rounded-lg px-3 py-2.5">
            <p className="text-xs text-text-secondary mb-1">Affected range</p>
            <p className="text-sm font-mono text-foreground">{dep.current_version ?? '—'}</p>
          </div>
          <div className="bg-surface-hover rounded-lg px-3 py-2.5">
            <p className="text-xs text-text-secondary mb-1">Fix in</p>
            <p className="text-sm font-mono text-success">{dep.latest_version ?? '—'}</p>
          </div>
        </div>

        {/* Description */}
        {d?.description && (
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1.5">
              Description
            </p>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line line-clamp-6">
              {d.description}
            </p>
          </div>
        )}

        {/* Links */}
        {d && (
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={d.ghsa_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              View on GitHub Advisory DB
            </a>
            {d.references.slice(0, 2).map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-foreground hover:underline truncate max-w-50"
              >
                {new URL(url).hostname}
              </a>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}

export function DependenciesTab({ site }: DependenciesTabProps) {
  const [deps, setDeps] = useState<Dependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [lastAudited, setLastAudited] = useState<string | null>(null);
  const [selected, setSelected] = useState<Dependency | null>(null);

  const fetchDeps = useCallback(async () => {
    try {
      const res = await fetch(`/api/sites/${site.id}/dependencies`);
      if (!res.ok) throw new Error('Failed to load dependencies');
      const data: Dependency[] = await res.json();
      setDeps(data);
      if (data.length > 0) {
        const latest = data.reduce((a, b) =>
          new Date(a.updated_at) > new Date(b.updated_at) ? a : b
        );
        setLastAudited(latest.updated_at);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [site.id]);

  useEffect(() => {
    fetchDeps();
  }, [fetchDeps]);

  async function handleRunAudit() {
    setAuditing(true);
    setAuditError(null);
    try {
      const res = await fetch(`/api/sites/${site.id}/audit-dependencies`, { method: 'POST' });
      const body = await res.json();
      if (!res.ok) {
        setAuditError(body.error ?? 'Audit failed');
        return;
      }
      setLoading(true);
      await fetchDeps();
    } catch {
      setAuditError('Network error — audit could not be started.');
    } finally {
      setAuditing(false);
    }
  }

  const grouped = groupBySeverity(deps);
  const total = deps.length;

  return (
    <div className="space-y-4">
      {selected && <VulnerabilityModal dep={selected} onClose={() => setSelected(null)} />}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Dependency Vulnerabilities</h3>
          {lastAudited && (
            <p className="text-sm text-text-secondary mt-0.5">
              Last audited{' '}
              {new Date(lastAudited).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRunAudit}
          loading={auditing}
          disabled={!site.github_repo}
          title={!site.github_repo ? 'No GitHub repo configured for this site' : undefined}
        >
          Run Audit Now
        </Button>
      </div>

      {/* No github_repo warning */}
      {!site.github_repo && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl px-4 py-3 text-sm text-warning">
          No GitHub repository configured for this site. Add an{' '}
          <span className="font-mono">owner/repo</span> value in the site settings to enable
          dependency auditing.
        </div>
      )}

      {/* Audit error */}
      {auditError && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
          {auditError}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <p className="text-text-secondary text-sm">Loading vulnerabilities…</p>
        </div>
      )}

      {/* Fetch error */}
      {!loading && error && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && total === 0 && (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-surface-hover mx-auto mb-3 flex items-center justify-center">
            <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h3 className="text-foreground font-medium mb-1">No vulnerabilities found</h3>
          <p className="text-sm text-text-secondary">
            {site.github_repo
              ? 'Run an audit to check for open Dependabot alerts.'
              : 'Configure a GitHub repo, then run an audit.'}
          </p>
        </div>
      )}

      {/* Vulnerability groups */}
      {!loading && !error && grouped.length > 0 && (
        <div className="space-y-4">
          {grouped.map(({ severity, items }) => {
            const cfg = severityConfig[severity];
            return (
              <div key={severity} className={`border ${cfg.border} rounded-xl overflow-hidden`}>
                <div className={`${cfg.bg} px-4 py-2.5 flex items-center gap-2 border-b ${cfg.border}`}>
                  <SeverityBadge severity={severity} />
                  <span className={`text-sm font-medium ${cfg.text}`}>
                    {items.length} {items.length === 1 ? 'vulnerability' : 'vulnerabilities'}
                  </span>
                </div>
                <table className="w-full bg-surface">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-text-secondary px-4 py-2.5">Package</th>
                      <th className="text-left text-xs font-medium text-text-secondary px-4 py-2.5">Installed / Affected Range</th>
                      <th className="text-left text-xs font-medium text-text-secondary px-4 py-2.5">Fix In</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((dep) => (
                      <tr
                        key={dep.id}
                        onClick={() => setSelected(dep)}
                        className="border-b border-border last:border-0 hover:bg-surface-hover/50 cursor-pointer"
                      >
                        <td className="px-4 py-3 text-sm font-mono text-foreground">{dep.package_name}</td>
                        <td className="px-4 py-3 text-sm font-mono text-text-secondary">{dep.current_version ?? '—'}</td>
                        <td className="px-4 py-3 text-sm font-mono text-success">{dep.latest_version ?? '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs text-text-secondary hover:text-foreground">Details →</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
