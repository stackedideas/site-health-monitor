'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AddClientDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddClientDialog({ open, onClose }: AddClientDialogProps) {
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contractStart, setContractStart] = useState('');
  const [retainer, setRetainer] = useState('');
  const [status, setStatus] = useState('active');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  function reset() {
    setName(''); setContactName(''); setContactEmail('');
    setContractStart(''); setRetainer(''); setStatus('active');
    setNotes(''); setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          contact_name: contactName || undefined,
          contact_email: contactEmail || undefined,
          contract_start: contractStart || undefined,
          monthly_retainer: retainer ? parseFloat(retainer) : undefined,
          status,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to add client'); return; }
      reset();
      onClose();
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={() => { reset(); onClose(); }} title="Add Client">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="c-name" label="Client Name" placeholder="Acme Corp" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input id="c-contact-name" label="Contact Name (optional)" placeholder="Jane Smith" value={contactName} onChange={(e) => setContactName(e.target.value)} />
        <Input id="c-contact-email" label="Contact Email (optional)" type="email" placeholder="jane@acme.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <Input id="c-contract-start" label="Contract Start (optional)" type="date" value={contractStart} onChange={(e) => setContractStart(e.target.value)} />
          <Input id="c-retainer" label="Monthly Retainer ($)" type="number" min="0" step="0.01" placeholder="0.00" value={retainer} onChange={(e) => setRetainer(e.target.value)} />
        </div>

        <div>
          <label htmlFor="c-status" className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
          <select
            id="c-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          >
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="paused">Paused</option>
            <option value="complete">Complete</option>
          </select>
        </div>

        <div>
          <label htmlFor="c-notes" className="block text-sm font-medium text-text-secondary mb-1.5">Notes (optional)</label>
          <textarea
            id="c-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any notes about this client…"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors resize-none"
          />
        </div>

        {error && <div className="px-3 py-2 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button type="submit" loading={loading}>Add Client</Button>
        </div>
      </form>
    </Dialog>
  );
}
