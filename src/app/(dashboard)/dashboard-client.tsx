'use client';

import { useState } from 'react';
import { SiteGrid } from '@/components/dashboard/site-grid';
import { AddSiteDialog } from '@/components/dashboard/add-site-dialog';
import { Button } from '@/components/ui/button';
import type { Site } from '@/lib/types';

interface DashboardClientProps {
  sites: Site[];
}

export function DashboardClient({ sites }: DashboardClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">
            Monitor the health of your websites
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Site
        </Button>
      </div>

      <SiteGrid sites={sites} />

      <AddSiteDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
