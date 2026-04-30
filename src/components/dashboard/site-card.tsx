'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { Site } from '@/lib/types';

interface SiteCardProps {
  site: Site;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function SiteCard({ site }: SiteCardProps) {
  return (
    <Link
      href={`/sites/${site.id}`}
      className="block bg-surface border border-border rounded-xl p-5 hover:border-accent/40 transition-colors group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground truncate group-hover:text-accent transition-colors">
            {site.name}
          </h3>
          <p className="text-sm text-text-secondary truncate mt-0.5">{site.url}</p>
        </div>
        <Badge status={site.current_status} size="sm" />
      </div>

      {site.description && (
        <p className="text-sm text-text-secondary mb-3 line-clamp-2">{site.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {timeAgo(site.last_checked_at)}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Every {site.check_interval_minutes}m
        </span>
        {!site.is_active && (
          <span className="text-warning">Paused</span>
        )}
      </div>
    </Link>
  );
}
