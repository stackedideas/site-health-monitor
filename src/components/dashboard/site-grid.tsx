'use client';

import { SiteCard } from './site-card';
import type { Site } from '@/lib/types';

interface SiteGridProps {
  sites: Site[];
}

export function SiteGrid({ sites }: SiteGridProps) {
  const healthy = sites.filter((s) => s.current_status === 'healthy').length;
  const degraded = sites.filter((s) => s.current_status === 'degraded').length;
  const down = sites.filter((s) => s.current_status === 'down').length;

  if (sites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">No sites monitored</h3>
        <p className="text-sm text-text-secondary">Add your first website to start monitoring its health.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg text-sm">
          <span className="text-text-secondary">Total:</span>
          <span className="font-medium text-foreground">{sites.length}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg text-sm">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="text-text-secondary">Healthy:</span>
          <span className="font-medium text-success">{healthy}</span>
        </div>
        {degraded > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg text-sm">
            <span className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-text-secondary">Degraded:</span>
            <span className="font-medium text-warning">{degraded}</span>
          </div>
        )}
        {down > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg text-sm">
            <span className="w-2 h-2 rounded-full bg-danger" />
            <span className="text-text-secondary">Down:</span>
            <span className="font-medium text-danger">{down}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sites.map((site) => (
          <SiteCard key={site.id} site={site} />
        ))}
      </div>
    </div>
  );
}
