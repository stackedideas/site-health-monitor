'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ClientStatusBadge } from '@/components/clients/client-status-badge';
import { EditClientDialog } from '@/components/clients/edit-client-dialog';
import { SiteCard } from '@/components/dashboard/site-card';
import type { Client, Site } from '@/lib/types';

interface ClientDetailClientProps {
  client: Client;
  sites: Site[];
}

function formatRetainer(amount: number | null): string {
  if (amount === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount) + '/mo';
}

export function ClientDetailClient({ client, sites }: ClientDetailClientProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Delete "${client.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
      if (res.ok) { router.push('/clients'); router.refresh(); }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
        <Link href="/clients" className="hover:text-foreground transition-colors">Clients</Link>
        <span>/</span>
        <span className="text-foreground">{client.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
            <ClientStatusBadge status={client.status} />
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
            {client.contact_name && (
              <span>{client.contact_name}</span>
            )}
            {client.contact_email && (
              <a href={`mailto:${client.contact_email}`} className="hover:text-accent transition-colors">
                {client.contact_email}
              </a>
            )}
            {client.contract_start && (
              <span>Since {new Date(client.contract_start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            )}
            {client.monthly_retainer !== null && (
              <span className="font-medium text-foreground">{formatRetainer(client.monthly_retainer)}</span>
            )}
          </div>
          {client.notes && (
            <p className="text-sm text-text-secondary mt-2 max-w-xl">{client.notes}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>Edit</Button>
          <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>Delete</Button>
        </div>
      </div>

      {/* Sites */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Projects <span className="text-text-secondary font-normal text-base">({sites.length})</span>
        </h2>
        {sites.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <p className="text-text-secondary text-sm">No sites linked to this client yet.</p>
            <p className="text-text-secondary text-sm mt-1">
              Add a site from the <Link href="/" className="text-accent hover:underline">Dashboard</Link> and assign it to this client.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sites.map((site) => <SiteCard key={site.id} site={site} />)}
          </div>
        )}
      </div>

      <EditClientDialog client={client} open={editOpen} onClose={() => { setEditOpen(false); router.refresh(); }} />
    </div>
  );
}
