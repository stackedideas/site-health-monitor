'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Client } from '@/lib/types';

interface EditClientDialogProps {
  client: Client;
  open: boolean;
  onClose: () => void;
}

export function EditClientDialog({ client, open, onClose }: EditClientDialogProps) {
  const [name, setName] = useState(client.name);
  const [contactName, setContactName] = useState(client.contact_name ?? '');
  const [contactEmail, setContactEmail] = useState(client.contact_email ?? '');
  const [contractStart, setContractStart] = useState(client.contract_start ?? '');
  const [retainer, setRetainer] = useState(client.monthly_retainer?.toString() ?? '');
  const [status, setStatus] = useState(client.status);
  const [notes, setNotes] = useState(client.notes ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    setName(client.name);
    setContactName(client.contact_name ?? '');
    setContactEmail(client.contact_email ?? '');
    setContractStart(client.contract_start ?? '');
    setRetainer(client.monthly_retainer?.toString() ?? '');
    setStatus(client.status);
    setNotes(client.notes ?? '');
    setError('');
  }, [client, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          contact_name: contactName || null,
          contact_email: contactEmail || null,
          contract_start: contractStart || null,
          monthly_retainer: retainer ? parseFloat(retainer) : null,
          status,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save changes'); return; }
      onClose();
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Edit Client">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="ec-name" label="Client Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input id="ec-contact-name" label="Contact Name (optional)" value={contactName} onChange={(e) => setContactName(e.target.value)} />
        <Input id="ec-contact-email" label="Contact Email (optional)" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <Input id="ec-contract-start" label="Contract Start" type="date" value={contractStart} onChange={(e) => setContractStart(e.target.value)} />
          <Input id="ec-retainer" label="Monthly Retainer ($)" type="number" min="0" step="0.01" value={retainer} onChange={(e) => setRetainer(e.target.value)} />
        </div>

        <div>
          <label htmlFor="ec-status" className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
          <select
            id="ec-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as Client['status'])}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          >
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="paused">Paused</option>
            <option value="complete">Complete</option>
          </select>
        </div>

        <div>
          <label htmlFor="ec-notes" className="block text-sm font-medium text-text-secondary mb-1.5">Notes (optional)</label>
          <textarea
            id="ec-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors resize-none"
          />
        </div>

        {error && <div className="px-3 py-2 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Save Changes</Button>
        </div>
      </form>
    </Dialog>
  );
}
