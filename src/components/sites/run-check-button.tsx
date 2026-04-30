'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface RunCheckButtonProps {
  siteId: string;
}

export function RunCheckButton({ siteId }: RunCheckButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/health-check/${siteId}`, { method: 'POST' });

      if (res.ok) {
        const data = await res.json();
        setResult(`${data.status} - ${data.response_time_ms}ms`);
        router.refresh();
      } else {
        const data = await res.json();
        setResult(data.error || 'Check failed');
      }
    } catch {
      setResult('Network error');
    } finally {
      setLoading(false);
      setTimeout(() => setResult(null), 3000);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={handleClick} loading={loading} size="sm">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Run Check Now
      </Button>
      {result && (
        <span className="text-sm text-text-secondary animate-in fade-in">{result}</span>
      )}
    </div>
  );
}
