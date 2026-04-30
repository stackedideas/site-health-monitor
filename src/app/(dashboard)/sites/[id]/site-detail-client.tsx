'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RunCheckButton } from '@/components/sites/run-check-button';
import { SiteTabs } from '@/components/sites/site-tabs';
import { EditSiteDialog } from '@/components/dashboard/edit-site-dialog';
import type { Site, HealthCheck } from '@/lib/types';

interface SiteDetailClientProps {
  site: Site;
  checks: HealthCheck[];
}

export function SiteDetailClient({ site, checks }: SiteDetailClientProps) {
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${site.name}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/sites/${site.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/');
        router.refresh();
      }
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
        <Link href="/" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-foreground">{site.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-foreground">{site.name}</h1>
            <Badge status={site.current_status} />
          </div>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:underline"
          >
            {site.url}
          </a>
          {site.description && (
            <p className="text-sm text-text-secondary mt-1">{site.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <RunCheckButton siteId={site.id} />
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>
            Delete
          </Button>
        </div>
      </div>

      <EditSiteDialog site={site} open={editOpen} onClose={() => setEditOpen(false)} />

      {/* Tabs */}
      <SiteTabs site={site} checks={checks} />
    </div>
  );
}
