'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Site, Client } from '@/lib/types';

interface EditSiteDialogProps {
  site: Site;
  open: boolean;
  onClose: () => void;
}

export function EditSiteDialog({ site, open, onClose }: EditSiteDialogProps) {
  const [name, setName] = useState(site.name);
  const [url, setUrl] = useState(site.url);
  const [description, setDescription] = useState(site.description ?? '');
  const [githubRepo, setGithubRepo] = useState(site.github_repo ?? '');
  const [checkInterval, setCheckInterval] = useState(String(site.check_interval_minutes));
  const [clientId, setClientId] = useState(site.client_id ?? '');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    setName(site.name);
    setUrl(site.url);
    setDescription(site.description ?? '');
    setGithubRepo(site.github_repo ?? '');
    setCheckInterval(String(site.check_interval_minutes));
    setClientId(site.client_id ?? '');
    setError('');
    fetch('/api/clients').then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setClients(data);
    }).catch(() => {});
  }, [site, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/sites/${site.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim(),
          description: description.trim() || undefined,
          github_repo: githubRepo.trim() || undefined,
          check_interval_minutes: parseInt(checkInterval, 10) || 5,
          client_id: clientId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save changes');
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Edit Site">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="edit-name" label="Name" placeholder="My Website" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input id="edit-url" label="URL" type="url" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} required />
        <Input id="edit-description" label="Description (optional)" placeholder="Production website" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input id="edit-github" label="GitHub Repo (optional)" placeholder="owner/repo" value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} />
        <Input id="edit-interval" label="Check Interval (minutes)" type="number" min="1" max="1440" value={checkInterval} onChange={(e) => setCheckInterval(e.target.value)} />

        <div>
          <label htmlFor="edit-client" className="block text-sm font-medium text-text-secondary mb-1.5">Client (optional)</label>
          <select
            id="edit-client"
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
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Save Changes</Button>
        </div>
      </form>
    </Dialog>
  );
}
