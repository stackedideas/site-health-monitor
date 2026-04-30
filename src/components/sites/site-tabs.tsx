'use client';

import { useState } from 'react';
import { Tabs } from '@/components/ui/tabs';
import { OverviewTab } from './overview-tab';
import { DependenciesTab } from './dependencies-tab';
import type { Site, HealthCheck } from '@/lib/types';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'pages', label: 'Pages' },
  { id: 'dependencies', label: 'Dependencies' },
  { id: 'security', label: 'Security' },
  { id: 'performance', label: 'Performance' },
  { id: 'history', label: 'History' },
];

interface SiteTabsProps {
  site: Site;
  checks: HealthCheck[];
}

function ComingSoon({ feature }: { feature: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-12 text-center">
      <div className="w-12 h-12 rounded-xl bg-surface-hover mx-auto mb-3 flex items-center justify-center">
        <svg className="w-6 h-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.652-3.397A1.2 1.2 0 015 10.673V6.327a1.2 1.2 0 01.768-1.1l5.652-3.397a1.2 1.2 0 011.16 0l5.652 3.397a1.2 1.2 0 01.768 1.1v4.346a1.2 1.2 0 01-.768 1.1l-5.652 3.397a1.2 1.2 0 01-1.16 0z" />
        </svg>
      </div>
      <h3 className="text-foreground font-medium mb-1">{feature}</h3>
      <p className="text-sm text-text-secondary">This feature is coming in a future update.</p>
    </div>
  );
}

export function SiteTabs({ site, checks }: SiteTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'overview' && <OverviewTab site={site} checks={checks} />}
      {activeTab === 'pages' && <ComingSoon feature="Page Health Checks" />}
      {activeTab === 'dependencies' && <DependenciesTab site={site} />}
      {activeTab === 'security' && <ComingSoon feature="Security Headers Check" />}
      {activeTab === 'performance' && <ComingSoon feature="Performance Metrics" />}
      {activeTab === 'history' && <OverviewTab site={site} checks={checks} />}
    </Tabs>
  );
}
