'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Client } from '@/lib/types';

interface AddSiteDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddSiteDialog({ open, onClose }: AddSiteDialogProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    fetch('/api/clients').then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setClients(data);
    }).catch(() => {});
  }, [open]);

  function resetForm() {
    setName(''); setUrl(''); setDescription('');
    setGithubRepo(''); setClientId(''); setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          url,
          description: description || undefined,
          github_repo: githubRepo || undefined,
          client_id: clientId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to add site');
        return;
      }
      resetForm();
      onClose();
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={() => { resetForm(); onClose(); }} title="Add Site">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="site-name" label="Name" placeholder="My Website" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input id="site-url" label="URL" type="url" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} required />
        <Input id="site-description" label="Description (optional)" placeholder="Production website" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input id="site-github" label="GitHub Repo (optional)" placeholder="owner/repo" value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} />

        <div>
          <label htmlFor="site-client" className="block text-sm font-medium text-text-secondary mb-1.5">Client (optional)</label>
          <select
            id="site-client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          >
            <option value="">No client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {error && <div className="px-3 py-2 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => { resetForm(); onClose(); }}>Cancel</Button>
          <Button type="submit" loading={loading}>Add Site</Button>
        </div>
      </form>
    </Dialog>
  );
}
