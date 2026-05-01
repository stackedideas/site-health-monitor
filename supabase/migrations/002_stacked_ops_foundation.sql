-- Stacked Ops — Phase 1A: Foundation tables
-- Run this in the Supabase SQL Editor

-- ============================================
-- Clients
-- ============================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT,
    contract_start DATE,
    monthly_retainer NUMERIC(10,2),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'maintenance', 'paused', 'complete')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to clients" ON clients FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Link sites to clients (optional)
-- ============================================
ALTER TABLE sites ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
CREATE INDEX idx_sites_client_id ON sites(client_id);

-- ============================================
-- Service connections
-- ============================================
CREATE TABLE service_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    service TEXT NOT NULL
        CHECK (service IN ('vercel', 'cloudflare', 'neon', 'supabase', 'resend', 'hubspot', 'analytics', 'uptimerobot')),
    external_id TEXT,
    external_slug TEXT,
    dashboard_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (site_id, service)
);

CREATE INDEX idx_service_connections_site_id ON service_connections(site_id);

CREATE TRIGGER update_service_connections_updated_at
    BEFORE UPDATE ON service_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE service_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to service_connections" ON service_connections FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Checklist templates (reusable definitions)
-- ============================================
CREATE TABLE checklist_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phase TEXT NOT NULL CHECK (phase IN ('kickoff', 'pre_launch', 'post_launch')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE checklist_template_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_template_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to checklist_templates" ON checklist_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to checklist_template_items" ON checklist_template_items FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Per-site checklist item instances
-- ============================================
CREATE TABLE checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    template_item_id UUID REFERENCES checklist_template_items(id) ON DELETE SET NULL,
    label TEXT NOT NULL,
    phase TEXT NOT NULL CHECK (phase IN ('kickoff', 'pre_launch', 'post_launch')),
    is_complete BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checklist_items_site_id ON checklist_items(site_id);
CREATE INDEX idx_checklist_items_phase ON checklist_items(site_id, phase);

CREATE TRIGGER update_checklist_items_updated_at
    BEFORE UPDATE ON checklist_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to checklist_items" ON checklist_items FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Security scores log
-- ============================================
CREATE TABLE security_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    tool TEXT NOT NULL
        CHECK (tool IN ('securityheaders', 'observatory', 'lighthouse_perf', 'lighthouse_a11y', 'lighthouse_seo', 'ssllabs')),
    grade TEXT,
    score NUMERIC(5,1),
    notes TEXT,
    checked_by TEXT,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_security_scores_site_id ON security_scores(site_id);
CREATE INDEX idx_security_scores_checked_at ON security_scores(checked_at DESC);

ALTER TABLE security_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to security_scores" ON security_scores FOR ALL USING (true) WITH CHECK (true);
