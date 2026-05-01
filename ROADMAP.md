# Stacked Ops — Roadmap

Evolution of the Site Health Monitor into a full internal ops portal for Stacked Ideas.

---

## Current state snapshot

### Working
- HTTP health checks (manual trigger + daily Vercel cron)
- Dependency auditing via GitHub Dependabot API (manual + weekly cron)
- Vulnerability detail modal (CVE, CVSS, description, fix version)
- Edit / Delete sites
- Session-based auth

### Incomplete / broken in the existing UI
These should be fixed before or alongside new feature work.

| Area | Problem | Fix needed |
|------|---------|-----------|
| History tab | Renders the Overview tab component — wrong | Dedicated paginated history view |
| Security tab | "Coming Soon" stub | Replaced by Security Scores tab (Phase 7) |
| Performance tab | "Coming Soon" stub | Covered by Lighthouse scores in Phase 7 |
| Pages tab | "Coming Soon" stub | Not in current roadmap — defer or remove |
| Settings page | Three placeholder cards, nothing functional | Wire up after Phase 2 (notifications via Resend) |
| Email alerts | `RESEND_API_KEY` in .env.example but never used | Wire up in Phase 1B after client layer exists |
| Check interval | Stored and displayed but only daily cron on Hobby plan | Document the UptimeRobot workaround in Settings UI |

---

## Build order

Phases are sequenced so each one builds on the last. Database work is front-loaded because everything downstream depends on it.

---

## Phase 1 — Database foundations

**Goal:** Add all new tables so subsequent phases can be built without further migrations.

### 1A — New tables

Run these migrations in the Supabase SQL Editor in order.

```sql
-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contract_start DATE,
  monthly_retainer NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','maintenance','paused','complete')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Link sites to clients (optional FK)
ALTER TABLE sites ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
CREATE INDEX idx_sites_client_id ON sites(client_id);

-- Service connections
CREATE TABLE service_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  service TEXT NOT NULL
    CHECK (service IN ('vercel','cloudflare','neon','supabase','resend','hubspot','analytics','uptimerobot')),
  external_id TEXT,
  external_slug TEXT,
  dashboard_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(site_id, service)
);
CREATE INDEX idx_service_connections_site_id ON service_connections(site_id);
CREATE TRIGGER update_service_connections_updated_at
  BEFORE UPDATE ON service_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Checklist templates (reusable definitions)
CREATE TABLE checklist_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('kickoff','pre_launch','post_launch')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE checklist_template_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Per-site checklist item instances
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  template_item_id UUID REFERENCES checklist_template_items(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('kickoff','pre_launch','post_launch')),
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_checklist_items_site_id ON checklist_items(site_id);
CREATE TRIGGER update_checklist_items_updated_at
  BEFORE UPDATE ON checklist_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Security scores log
CREATE TABLE security_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  tool TEXT NOT NULL
    CHECK (tool IN ('securityheaders','observatory','lighthouse_perf','lighthouse_a11y','lighthouse_seo','ssllabs')),
  grade TEXT,
  score NUMERIC(5,1),
  notes TEXT,
  checked_by TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_security_scores_site_id ON security_scores(site_id);
CREATE INDEX idx_security_scores_checked_at ON security_scores(checked_at DESC);
```

### 1B — Seed checklist templates

After running 1A, seed the three standard templates:

**New Project Kickoff**
1. Domain purchased and pointed to Cloudflare
2. Cloudflare zone created, nameservers updated
3. Vercel project created, custom domain added
4. Environment variables documented in .env.example
5. GitHub repo created, initial commit pushed
6. Supabase or Neon project provisioned
7. Resend domain added and DNS records verified
8. Analytics property created, tracking ID added

**Pre-Launch Security Checklist**
1. Every protected route checks authentication server-side
2. All user input validated server-side (type, format, length)
3. SQL uses parameterised queries — no string concatenation
4. Rate limiting on all public-facing endpoints
5. Auth endpoints have stricter rate limits
6. Security headers configured: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP
7. No console.log left in API/server code
8. No hardcoded URLs, emails, or secrets in source
9. .env.example updated with all required variables
10. Robots.txt and sitemap.xml present
11. OG metadata set for all key pages

**Post-Launch**
1. securityheaders.com scan run, result logged (aim A+)
2. observatory.mozilla.org scan run, result logged
3. Lighthouse scores run and logged (Performance, Accessibility, SEO)
4. Uptime monitor added (UptimeRobot or equivalent)
5. SPF, DKIM, DMARC verified via mxtoolbox.com
6. SSL grade checked via ssllabs.com (aim A+)
7. Client handed login credentials and briefed on CMS (if applicable)
8. Project marked as launched in this portal

**Seed SQL:**

```sql
-- Kickoff template
WITH t AS (
  INSERT INTO checklist_templates (name, phase, sort_order)
  VALUES ('New Project Kickoff', 'kickoff', 1)
  RETURNING id
)
INSERT INTO checklist_template_items (template_id, label, sort_order)
SELECT t.id, item.label, item.ord FROM t,
(VALUES
  (1, 'Domain purchased and pointed to Cloudflare'),
  (2, 'Cloudflare zone created, nameservers updated'),
  (3, 'Vercel project created, custom domain added'),
  (4, 'Environment variables documented in .env.example'),
  (5, 'GitHub repo created, initial commit pushed'),
  (6, 'Supabase or Neon project provisioned'),
  (7, 'Resend domain added and DNS records verified'),
  (8, 'Analytics property created, tracking ID added')
) AS item(ord, label);

-- Pre-launch template
WITH t AS (
  INSERT INTO checklist_templates (name, phase, sort_order)
  VALUES ('Pre-Launch Security Checklist', 'pre_launch', 2)
  RETURNING id
)
INSERT INTO checklist_template_items (template_id, label, sort_order)
SELECT t.id, item.label, item.ord FROM t,
(VALUES
  (1,  'Every protected route checks authentication server-side'),
  (2,  'All user input validated server-side (type, format, length)'),
  (3,  'SQL uses parameterised queries — no string concatenation'),
  (4,  'Rate limiting on all public-facing endpoints'),
  (5,  'Auth endpoints have stricter rate limits'),
  (6,  'Security headers configured: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP'),
  (7,  'No console.log left in API/server code'),
  (8,  'No hardcoded URLs, emails, or secrets in source'),
  (9,  '.env.example updated with all required variables'),
  (10, 'Robots.txt and sitemap.xml present'),
  (11, 'OG metadata set for all key pages')
) AS item(ord, label);

-- Post-launch template
WITH t AS (
  INSERT INTO checklist_templates (name, phase, sort_order)
  VALUES ('Post-Launch', 'post_launch', 3)
  RETURNING id
)
INSERT INTO checklist_template_items (template_id, label, sort_order)
SELECT t.id, item.label, item.ord FROM t,
(VALUES
  (1, 'securityheaders.com scan run, result logged (aim A+)'),
  (2, 'observatory.mozilla.org scan run, result logged'),
  (3, 'Lighthouse scores run and logged (Performance, Accessibility, SEO)'),
  (4, 'Uptime monitor added (UptimeRobot or equivalent)'),
  (5, 'SPF, DKIM, DMARC verified via mxtoolbox.com'),
  (6, 'SSL grade checked via ssllabs.com (aim A+)'),
  (7, 'Client handed login credentials and briefed on CMS (if applicable)'),
  (8, 'Project marked as launched in this portal')
) AS item(ord, label);
```

---

## Phase 2 — Client CRUD

**Goal:** Create, view, edit, and delete clients. No site linking yet.

### Files to create
- `src/app/api/clients/route.ts` — GET (list), POST (create)
- `src/app/api/clients/[id]/route.ts` — PUT (update), DELETE
- `src/app/(dashboard)/clients/page.tsx` — clients list page
- `src/app/(dashboard)/clients/[id]/page.tsx` — client detail (server component)
- `src/app/(dashboard)/clients/[id]/client-detail-client.tsx` — client component
- `src/components/clients/add-client-dialog.tsx`
- `src/components/clients/edit-client-dialog.tsx`

### UI spec
**Clients list** (`/clients`):
- Table with columns: Name, Contact, Status badge, Sites count, Monthly retainer, Actions (Edit, Delete)
- "Add Client" button top-right
- Status badge colours: active=green, maintenance=yellow, paused=grey, complete=blue

**Client detail** (`/clients/[id]`):
- Header: name, status, contact info, contract start, retainer
- Edit / Delete buttons
- Grid of site cards (same SiteCard component) filtered to this client
- Each card links to the site detail

### API validation
- `name` required, trimmed, max 100 chars
- `contact_email` validated as email format if provided
- `monthly_retainer` must be positive number if provided
- `status` must be one of the four enum values

---

## Phase 3 — Link sites to clients + dashboard grouping

**Goal:** Sites can belong to a client. Dashboard groups sites by client.

### Changes
- `AddSiteDialog` and `EditSiteDialog`: add a Client dropdown (fetches client list, optional)
- `PUT /api/sites/[id]`: accept `client_id` in body
- `POST /api/sites`: accept `client_id` in body
- Dashboard page: fetch sites joined with clients, group by client
- Sites with no client appear under an "Unassigned" section
- Client name in each section header links to the client detail page

### Header nav update
Add "Clients" link to `src/components/layout/header.tsx` nav alongside Dashboard.

---

## Phase 4 — Fix existing broken tabs

**Goal:** Clear the existing "Coming Soon" and wrong-render debt before adding new tabs.

### History tab
- Currently renders `<OverviewTab>` — should be a dedicated view
- Show all health checks paginated (50 per page), not just the last 20
- Columns: Time, Status, Status Code, Response Time, Error
- Filter controls: status filter (all / healthy / degraded / down), date range

### Settings page
- Replace the three placeholder cards with real content:
  - **Notifications**: toggle email alerts on/off, configure the email address (stored in a simple `settings` table or env var), test send button — requires Resend API key wired up
  - **GitHub Integration**: show whether `GITHUB_TOKEN` is configured (read from env, never expose the value), link to docs on how to set it
  - **Check Frequency**: explain the daily cron limit on Hobby plan, show the UptimeRobot workaround instructions

### Pages tab
- Defer or remove — not in the new product vision. For now, remove from the tab list entirely to stop showing a dead tab.

---

## Phase 5 — Checklists tab

**Goal:** Per-site checklist covering the three phases. Checkboxes, inline completion, progress bars.

### API routes
- `GET /api/sites/[id]/checklists` — returns items grouped by phase; if no items exist for the site yet, auto-provisions from templates
- `PATCH /api/sites/[id]/checklists/[itemId]` — toggle `is_complete`, set `completed_at`, update `notes`

### Auto-provision logic
On first fetch, if `checklist_items` has no rows for this `site_id`, copy all `checklist_template_items` rows into `checklist_items` for this site (one-time seed per site).

### UI spec (`src/components/sites/checklists-tab.tsx`)
- Three collapsible sections: Kickoff, Pre-Launch, Post-Launch
- Each section header shows: phase name + completion count (e.g. "5 / 8 complete") + progress bar
- Each item: checkbox, label, optional notes field (expand on click), completed timestamp if done
- Clicking the checkbox PATCHes immediately (optimistic UI update)
- Overall completion percentage shown in the tab header

---

## Phase 6 — Service connections

**Goal:** Store and display the IDs/slugs that link a site to each external service. No live API calls yet — just the links.

### API routes
- `GET /api/sites/[id]/services` — list connections for a site
- `POST /api/sites/[id]/services` — add a connection
- `PUT /api/sites/[id]/services/[connId]` — update
- `DELETE /api/sites/[id]/services/[connId]` — remove

### UI spec — Services tab (`src/components/sites/services-tab.tsx`)
- Card per connected service showing: service logo/icon, service name, external ID/slug, dashboard URL as a clickable button ("Open in Vercel →"), notes
- "Add Service" button opens a dialog with:
  - Service dropdown (the 8 supported services)
  - External ID field (with per-service placeholder hint, e.g. "prj_xxxx" for Vercel)
  - External slug field (e.g. Vercel project name)
  - Dashboard URL field (auto-built from slug where possible, editable)
  - Notes
- Edit and remove buttons per card
- Services not yet connected show as faded "not configured" cards with an "Add" button

### Service icon set
Simple SVG icons or text badges for: Vercel, Cloudflare, Neon, Supabase, Resend, HubSpot, Analytics, UptimeRobot.

---

## Phase 7 — External API integrations

**Goal:** For each configured service connection, fetch live status from that service's API. Read-only. Graceful degradation if API key missing or call fails.

### New env vars (add to .env.example)
```
VERCEL_API_TOKEN=your-vercel-token
CLOUDFLARE_API_TOKEN=your-cloudflare-token
# NEON_API_KEY already supported via MCP
```

### New API route
`GET /api/sites/[id]/service-status` — server-side, fetches all connected service statuses in parallel, returns a map of `service → status object`. Times out each external call at 5s. Never errors the whole response — any failed call returns `{ status: 'unavailable' }`.

### Per-service status shapes

**Vercel** (requires `external_id` = project ID, `VERCEL_API_TOKEN`)
```
GET https://api.vercel.com/v9/projects/{projectId}/deployments?limit=1
→ { deployments[0]: { state, createdAt, url } }
```
Display: latest deployment state badge, deploy time, production URL

**Cloudflare** (requires `external_id` = zone ID, `CLOUDFLARE_API_TOKEN`)
```
GET https://api.cloudflare.com/client/v4/zones/{zoneId}/settings/ssl
GET https://api.cloudflare.com/client/v4/zones/{zoneId}/settings/security_level
```
Display: SSL mode, security level

**Neon** (requires `external_id` = project ID, `NEON_API_KEY`)
```
GET https://console.neon.tech/api/v2/projects/{projectId}
→ { project: { id, name, provisioner, region_id, pg_version } }
```
Display: project status, region, Postgres version

**Resend** (requires `external_id` = domain name, `RESEND_API_KEY`)
```
GET https://api.resend.com/domains
→ find domain by name, check { status, records[] }
```
Display: domain verification status, DNS records status

### UI — Integrations tab (`src/components/sites/integrations-tab.tsx`)
- Card per service connection that has an API key configured
- Each card: service name, live status badge, key details, "last fetched" timestamp, Refresh button
- Services without an API key env var: show the dashboard link only, no live status
- Services not connected at all: show faded "not configured" state

---

## Phase 8 — Security scores log

**Goal:** Manually log scores from external audit tools per site. Simple table + add form.

### API routes
- `GET /api/sites/[id]/security-scores` — list scores, newest first
- `POST /api/sites/[id]/security-scores` — add a score entry
- `DELETE /api/sites/[id]/security-scores/[scoreId]` — remove an entry

### UI spec — Security Scores tab (`src/components/sites/security-scores-tab.tsx`)
- Table: Tool, Grade, Score, Notes, Date, Delete button
- "Log Score" button opens a dialog:
  - Tool dropdown (securityheaders, observatory, lighthouse_perf, lighthouse_a11y, lighthouse_seo, ssllabs)
  - Grade field (free text: A+, B, 94, etc.)
  - Score field (numeric, optional)
  - Notes field
  - Date (defaults to today)
- Each tool's best-ever grade shown as a summary card at top
- External links to each tool pre-filled with the site URL

---

## Phase 9 — Rename to Stacked Ops

**Goal:** Rebrand the UI throughout. No structural changes.

### Files to update
- `src/components/layout/header.tsx` — change "Site Health Monitor" to "Stacked Ops", update the logo icon if desired
- `src/app/layout.tsx` — update `<title>` and metadata
- `public/` — update favicon if applicable
- Settings page title

---

## Deferred / out of scope for now
- Pages tab (individual page-level health checks within a site)
- HubSpot, Analytics, UptimeRobot API integrations (add to Phase 7 if API docs are straightforward)
- Multi-user / team access (currently single admin)
- Client-facing portal (read-only view for clients to see their site health)
- Mobile app

---

## Env vars full list (target state)

| Variable | Required for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All DB operations |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB |
| `ADMIN_PASSWORD` | Login |
| `SESSION_SECRET` | Cookie signing |
| `CRON_SECRET` | Cron job auth |
| `GITHUB_TOKEN` | Dependency auditing |
| `RESEND_API_KEY` | Email alerts (Phase 4) |
| `VERCEL_API_TOKEN` | Vercel status (Phase 7) |
| `CLOUDFLARE_API_TOKEN` | Cloudflare status (Phase 7) |
| `NEON_API_KEY` | Neon status (Phase 7) |
