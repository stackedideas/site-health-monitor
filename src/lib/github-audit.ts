interface DependabotAlert {
  number: number;
  state: string;
  dependency: {
    package: { ecosystem: string; name: string };
    manifest_path: string;
  };
  security_advisory: {
    ghsa_id: string;
    cve_id: string | null;
    summary: string;
    description: string;
    severity: string;
    cvss: { score: number; vector_string: string } | null;
    references: Array<{ url: string }>;
  };
  security_vulnerability: {
    vulnerable_version_range: string;
    first_patched_version: { identifier: string } | null;
  };
}

export interface AdvisoryDetails {
  summary: string;
  description: string;
  cve_id: string | null;
  ghsa_id: string;
  ghsa_url: string;
  cvss_score: number | null;
  references: string[];
}

export interface AuditVulnerability {
  package_name: string;
  current_version: string | null;
  latest_version: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
  details: AdvisoryDetails;
}

function normaliseSeverity(raw: string): 'critical' | 'high' | 'medium' | 'low' {
  const s = raw.toLowerCase();
  if (s === 'critical') return 'critical';
  if (s === 'high') return 'high';
  if (s === 'medium' || s === 'moderate') return 'medium';
  return 'low';
}

async function fetchInstalledVersions(
  owner: string,
  repo: string,
  token: string
): Promise<Record<string, string>> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/package.json`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );
    if (!res.ok) return {};
    const data = await res.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    const pkg = JSON.parse(content);
    return { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  } catch {
    return {};
  }
}

export async function fetchDependabotAlerts(
  githubRepo: string,
  token: string
): Promise<AuditVulnerability[]> {
  const [owner, repo] = githubRepo.split('/');
  if (!owner || !repo) {
    throw new Error(`Invalid github_repo format: expected "owner/repo", got "${githubRepo}"`);
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/dependabot/alerts?state=open&per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (res.status === 404) {
    throw new Error(
      `Repository "${githubRepo}" not found or Dependabot alerts are not enabled. ` +
        'Enable them under Settings → Security → Code security and analysis.'
    );
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${body}`);
  }

  const alerts: DependabotAlert[] = await res.json();
  const installedVersions = await fetchInstalledVersions(owner, repo, token);

  return alerts
    .filter((a) => a.state === 'open')
    .map((a) => {
      const name = a.dependency.package.name;
      const declared = installedVersions[name] ?? null;
      const fixedIn = a.security_vulnerability.first_patched_version?.identifier ?? null;
      const advisory = a.security_advisory;

      return {
        package_name: name,
        current_version: declared ?? a.security_vulnerability.vulnerable_version_range ?? null,
        latest_version: fixedIn,
        severity: normaliseSeverity(advisory.severity),
        details: {
          summary: advisory.summary,
          description: advisory.description,
          cve_id: advisory.cve_id ?? null,
          ghsa_id: advisory.ghsa_id,
          ghsa_url: `https://github.com/advisories/${advisory.ghsa_id}`,
          cvss_score: advisory.cvss?.score ?? null,
          references: advisory.references.map((r) => r.url),
        },
      };
    });
}
