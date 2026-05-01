'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ClientStatusBadge } from '@/components/clients/client-status-badge';
import { AddClientDialog } from '@/components/clients/add-client-dialog';
import { EditClientDialog } from '@/components/clients/edit-client-dialog';
import type { Client } from '@/lib/types';

interface ClientWithCount extends Client {
  sites: [{ count: number }] | [];
}

function formatRetainer(amount: number | null): string {
  if (amount === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function fetchClients() {
    const res = await fetch('/api/clients');
    if (res.ok) setClients(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchClients(); }, []);

  async function handleDelete(client: Client) {
    if (!confirm(`Delete "${client.name}"? This cannot be undone.`)) return;
    setDeleting(client.id);
    try {
      await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
      setClients((prev) => prev.filter((c) => c.id !== client.id));
    } finally {
      setDeleting(null);
    }
  }

  function siteCount(client: ClientWithCount): number {
    return client.sites?.[0]?.count ?? 0;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-sm text-text-secondary mt-1">Manage your studio clients and their projects</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Client
        </Button>
      </div>

      {loading ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <p className="text-text-secondary text-sm">Loading clients…</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <h3 className="text-foreground font-medium mb-1">No clients yet</h3>
          <p className="text-sm text-text-secondary mb-4">Add your first client to start organising your projects.</p>
          <Button onClick={() => setAddOpen(true)}>Add Client</Button>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">Client</th>
                <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">Contact</th>
                <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">Status</th>
                <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">Sites</th>
                <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">Retainer</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-border last:border-0 hover:bg-surface-hover/50">
                  <td className="px-4 py-3">
                    <Link href={`/clients/${client.id}`} className="font-medium text-foreground hover:text-accent transition-colors">
                      {client.name}
                    </Link>
                    {client.contract_start && (
                      <p className="text-xs text-text-secondary mt-0.5">
                        Since {new Date(client.contract_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {client.contact_name ? (
                      <div>
                        <p className="text-sm text-foreground">{client.contact_name}</p>
                        {client.contact_email && (
                          <a href={`mailto:${client.contact_email}`} className="text-xs text-text-secondary hover:text-accent transition-colors">
                            {client.contact_email}
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-text-secondary">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ClientStatusBadge status={client.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{siteCount(client)}</td>
                  <td className="px-4 py-3 text-sm text-foreground font-mono">{formatRetainer(client.monthly_retainer)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditTarget(client)}>Edit</Button>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={deleting === client.id}
                        onClick={() => handleDelete(client)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddClientDialog open={addOpen} onClose={() => { setAddOpen(false); fetchClients(); }} />
      {editTarget && (
        <EditClientDialog
          client={editTarget}
          open={!!editTarget}
          onClose={() => { setEditTarget(null); fetchClients(); }}
        />
      )}
    </div>
  );
}
