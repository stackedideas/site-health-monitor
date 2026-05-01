-- Stacked Ops — Phase 1B: Seed checklist templates
-- Run this AFTER 002_stacked_ops_foundation.sql

-- ============================================
-- New Project Kickoff
-- ============================================
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

-- ============================================
-- Pre-Launch Security Checklist
-- ============================================
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

-- ============================================
-- Post-Launch
-- ============================================
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
