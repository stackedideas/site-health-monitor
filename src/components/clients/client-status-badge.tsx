import type { ClientStatus } from '@/lib/types';

const config: Record<ClientStatus, { label: string; bg: string; text: string; dot: string }> = {
  active:      { label: 'Active',      bg: 'bg-success/10',       text: 'text-success',        dot: 'bg-success' },
  maintenance: { label: 'Maintenance', bg: 'bg-warning/10',       text: 'text-warning',        dot: 'bg-warning' },
  paused:      { label: 'Paused',      bg: 'bg-surface-hover',    text: 'text-text-secondary', dot: 'bg-text-secondary' },
  complete:    { label: 'Complete',    bg: 'bg-accent/10',        text: 'text-accent',         dot: 'bg-accent' },
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
