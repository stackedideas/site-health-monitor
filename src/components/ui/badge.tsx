import type { SiteStatus } from '@/lib/types';

interface BadgeProps {
  status: SiteStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<SiteStatus, { label: string; dotClass: string; bgClass: string }> = {
  healthy: {
    label: 'Healthy',
    dotClass: 'bg-success',
    bgClass: 'bg-success/10 text-success',
  },
  degraded: {
    label: 'Degraded',
    dotClass: 'bg-warning',
    bgClass: 'bg-warning/10 text-warning',
  },
  down: {
    label: 'Down',
    dotClass: 'bg-danger',
    bgClass: 'bg-danger/10 text-danger',
  },
  unknown: {
    label: 'Unknown',
    dotClass: 'bg-text-secondary',
    bgClass: 'bg-surface-hover text-text-secondary',
  },
};

export function Badge({ status, size = 'md' }: BadgeProps) {
  const config = statusConfig[status];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bgClass} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
}
