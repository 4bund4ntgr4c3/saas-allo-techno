-- Migration: Batch 22 tables (inventory, SLA, satisfaction, notifications, device-history, warranties, scheduled-reports, escalation, KB)

-- Inventory parts
CREATE TABLE IF NOT EXISTS inventory_parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT '',
  brand TEXT DEFAULT '',
  model TEXT DEFAULT '',
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 5,
  unit_price NUMERIC DEFAULT 0,
  supplier_id UUID,
  location TEXT DEFAULT '',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory_parts(quantity) WHERE active = TRUE;

-- Stock movements
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  part_id UUID REFERENCES inventory_parts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT DEFAULT '',
  reservation_id UUID,
  performed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_part ON stock_movements(part_id);

-- SLA configs
CREATE TABLE IF NOT EXISTS sla_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status_from TEXT NOT NULL,
  status_to TEXT NOT NULL,
  target_hours INTEGER NOT NULL,
  alert_hours INTEGER NOT NULL,
  active BOOLEAN DEFAULT TRUE
);

-- Satisfaction surveys
CREATE TABLE IF NOT EXISTS satisfaction_surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  nps_score INTEGER NOT NULL CHECK (nps_score >= 0 AND nps_score <= 10),
  comment TEXT,
  recommend BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_satisfaction_reservation ON satisfaction_surveys(reservation_id);

-- Internal notifications
CREATE TABLE IF NOT EXISTS internal_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reservation_id UUID,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_internal_notifs_unread ON internal_notifications(read) WHERE read = FALSE;

-- Extended warranties
CREATE TABLE IF NOT EXISTS extended_warranties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  device TEXT NOT NULL,
  warranty_months INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warranties_active ON extended_warranties(status) WHERE status = 'active';

-- Scheduled reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL,
  recipients TEXT[] NOT NULL DEFAULT '{}',
  metrics TEXT[] NOT NULL DEFAULT '{}',
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Escalation rules
CREATE TABLE IF NOT EXISTS escalation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sla_stage TEXT NOT NULL,
  escalate_after_hours INTEGER NOT NULL,
  notify_roles TEXT[] NOT NULL DEFAULT '{}',
  auto_reassign BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE
);

-- Escalation events history
CREATE TABLE IF NOT EXISTS escalation_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID,
  reference TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  device TEXT NOT NULL,
  from_status TEXT NOT NULL,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  notified_roles TEXT[] NOT NULL DEFAULT '{}',
  reassigned_to TEXT
);

-- Knowledge base articles
CREATE TABLE IF NOT EXISTS kb_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  author TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  helpful INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kb_category ON kb_articles(category);
CREATE INDEX IF NOT EXISTS idx_kb_search ON kb_articles USING gin(to_tsvector('french', title || ' ' || content));

-- Default SLA configs
INSERT INTO sla_configs (status_from, status_to, target_hours, alert_hours) VALUES
  ('en_attente', 'confirmee', 2, 1),
  ('confirmee', 'en_cours', 24, 18),
  ('en_cours', 'pret', 48, 36),
  ('pret', 'livre', 8, 4)
ON CONFLICT DO NOTHING;

-- Default escalation rules
INSERT INTO escalation_rules (sla_stage, escalate_after_hours, notify_roles, auto_reassign) VALUES
  ('en_attente', 4, ARRAY['admin', 'staff'], FALSE),
  ('confirmee', 36, ARRAY['admin'], TRUE),
  ('en_cours', 72, ARRAY['admin', 'staff'], TRUE)
ON CONFLICT DO NOTHING;

-- Feature flags for batch 22
INSERT INTO feature_flags (key, enabled) VALUES
  ('inventory_management', TRUE),
  ('sla_tracking', TRUE),
  ('satisfaction_surveys', TRUE),
  ('knowledge_base', TRUE),
  ('extended_warranty', TRUE),
  ('scheduled_reports', FALSE),
  ('auto_escalation', TRUE)
ON CONFLICT (key) DO NOTHING;
