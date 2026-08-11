-- Migration: Batch 21 tables (workshops, suppliers, chat, referrals, reports, google reviews cache)

-- Workshops multi-ateliers
CREATE TABLE IF NOT EXISTS workshops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  lat NUMERIC,
  lng NUMERIC,
  timezone TEXT DEFAULT 'Africa/Porto-Novo',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers & orders
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  speciality TEXT DEFAULT '',
  rating NUMERIC DEFAULT 5,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  parts JSONB NOT NULL DEFAULT '[]',
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  expected_delivery TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  sender_id UUID,
  sender_type TEXT NOT NULL DEFAULT 'customer',
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_reservation ON chat_messages(reservation_id);
CREATE INDEX IF NOT EXISTS idx_chat_unread ON chat_messages(reservation_id, sender_type) WHERE read_at IS NULL;

-- Referrals program
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID,
  referred_id UUID,
  status TEXT DEFAULT 'pending',
  reward_amount NUMERIC DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Saved reports
CREATE TABLE IF NOT EXISTS saved_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '[]',
  group_by TEXT DEFAULT 'day',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Google reviews cache
CREATE TABLE IF NOT EXISTS google_reviews_cache (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- API keys for public REST API
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['read'],
  rate_limit INTEGER DEFAULT 100,
  active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash) WHERE active = TRUE;

-- Feature flags defaults
INSERT INTO feature_flags (key, enabled) VALUES
  ('referral_program', TRUE),
  ('multi_workshop', FALSE),
  ('supplier_management', FALSE),
  ('chat_messaging', FALSE),
  ('google_reviews_widget', TRUE),
  ('public_api', FALSE)
ON CONFLICT (key) DO NOTHING;
