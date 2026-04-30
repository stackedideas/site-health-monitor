-- Site Health Monitor - Initial Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Sites table: each monitored website
-- ============================================
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    github_repo TEXT,
    check_interval_minutes INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT true,
    current_status TEXT NOT NULL DEFAULT 'unknown'
        CHECK (current_status IN ('healthy', 'degraded', 'down', 'unknown')),
    last_checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Health checks table: individual check results
-- ============================================
CREATE TABLE health_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    check_type TEXT NOT NULL DEFAULT 'http',
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    details JSONB,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_checks_site_id ON health_checks(site_id);
CREATE INDEX idx_health_checks_checked_at ON health_checks(checked_at DESC);
CREATE INDEX idx_health_checks_site_checked ON health_checks(site_id, checked_at DESC);

-- ============================================
-- Alerts table: notification history
-- ============================================
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('down', 'degraded', 'recovered')),
    message TEXT NOT NULL,
    is_acknowledged BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_site_id ON alerts(site_id);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);

-- ============================================
-- Dependencies table: tracked npm packages
-- ============================================
CREATE TABLE dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    package_name TEXT NOT NULL,
    current_version TEXT,
    latest_version TEXT,
    severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dependencies_site_id ON dependencies(site_id);

-- ============================================
-- Auto-update updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sites_updated_at
    BEFORE UPDATE ON sites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dependencies_updated_at
    BEFORE UPDATE ON dependencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (permissive - admin-only app)
-- Service role key bypasses RLS by default
-- ============================================
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to sites" ON sites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to health_checks" ON health_checks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to alerts" ON alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to dependencies" ON dependencies FOR ALL USING (true) WITH CHECK (true);
