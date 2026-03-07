-- ============================================
-- FLFloripa Performance — Supabase Schema
-- ============================================
-- Execute este arquivo no SQL Editor do Supabase
-- para criar todas as tabelas e configurações.
-- ============================================

-- ============================================
-- 1. EXTENSION para gerar IDs
-- ============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Função para gerar cuid-like IDs
CREATE OR REPLACE FUNCTION generate_cuid()
RETURNS TEXT AS $$
  SELECT encode(gen_random_bytes(16), 'hex');
$$ LANGUAGE sql;

-- ============================================
-- 2. ENUMS
-- ============================================

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');
CREATE TYPE "ChannelPlatform" AS ENUM ('INSTAGRAM', 'TIKTOK', 'LINKEDIN', 'YOUTUBE');
CREATE TYPE "ChannelStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR');
CREATE TYPE "CampaignStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');
CREATE TYPE "ContentCategory" AS ENUM ('EDUCATIONAL', 'INSTITUTIONAL', 'INVITE', 'TESTIMONY');
CREATE TYPE "ContentStatus" AS ENUM ('PLANNED', 'CREATED', 'PUBLISHED');
CREATE TYPE "ContentTheme" AS ENUM ('ENSINAMENTO', 'CONVITE', 'EXPERIENCIA', 'REFORCO_CONVITE', 'DICA_LEITURA', 'PODCAST', 'DIVULGACAO', 'OUTRO');
CREATE TYPE "ContentFormat" AS ENUM ('FEED_POST', 'REEL', 'STORY', 'VIDEO_LONGO', 'IMAGEM_ESTATICA', 'EVENTO', 'REPOST', 'OUTRO');
CREATE TYPE "FunnelSource" AS ENUM ('AUTO', 'MANUAL');
CREATE TYPE "AlertType" AS ENUM ('ENGAGEMENT_DROP', 'CAMPAIGN_UNDERPERFORM', 'CADENCE_MISS');
CREATE TYPE "ReportType" AS ENUM ('WEEKLY', 'MONTHLY', 'CUSTOM');

-- ============================================
-- 3. TABELAS
-- ============================================

-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT,
  image TEXT,
  role "UserRole" NOT NULL DEFAULT 'VIEWER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Accounts (NextAuth OAuth)
CREATE TABLE accounts (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  UNIQUE(provider, provider_account_id)
);

-- Channels
CREATE TABLE channels (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  platform "ChannelPlatform" NOT NULL,
  account_name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  status "ChannelStatus" NOT NULL DEFAULT 'CONNECTED',
  user_id TEXT NOT NULL REFERENCES users(id),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Posts
CREATE TABLE posts (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  external_id TEXT NOT NULL,
  channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  title TEXT,
  url TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  metrics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel_id, external_id)
);

-- Metrics (daily per channel)
CREATE TABLE metrics (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  reach INTEGER NOT NULL DEFAULT 0,
  engagement INTEGER NOT NULL DEFAULT 0,
  profile_visits INTEGER NOT NULL DEFAULT 0,
  link_clicks INTEGER NOT NULL DEFAULT 0,
  followers_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel_id, date)
);
CREATE INDEX idx_metrics_channel_date ON metrics(channel_id, date);

-- Campaigns
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  meta_campaign_id TEXT UNIQUE NOT NULL,
  channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status "CampaignStatus" NOT NULL DEFAULT 'ACTIVE',
  objective TEXT,
  budget DOUBLE PRECISION NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Campaign Metrics (daily)
CREATE TABLE campaign_metrics (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  spend DOUBLE PRECISION NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  cpm DOUBLE PRECISION NOT NULL DEFAULT 0,
  cpc DOUBLE PRECISION NOT NULL DEFAULT 0,
  ctr DOUBLE PRECISION NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, date)
);
CREATE INDEX idx_campaign_metrics_campaign_date ON campaign_metrics(campaign_id, date);

-- Funnel Stages
CREATE TABLE funnel_stages (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  description TEXT,
  source "FunnelSource" NOT NULL DEFAULT 'MANUAL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads
CREATE TABLE leads (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  channel_origin TEXT,
  current_stage_id TEXT NOT NULL REFERENCES funnel_stages(id),
  registered_by_id TEXT NOT NULL REFERENCES users(id),
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_current_stage ON leads(current_stage_id);
CREATE INDEX idx_leads_is_deleted ON leads(is_deleted);

-- Lead Events
CREATE TABLE lead_events (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  from_stage_id TEXT NOT NULL REFERENCES funnel_stages(id),
  to_stage_id TEXT NOT NULL REFERENCES funnel_stages(id),
  notes TEXT,
  created_by_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lead_events_lead ON lead_events(lead_id);

-- Content Calendar Entries
CREATE TABLE content_calendar_entries (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  title TEXT NOT NULL,
  description TEXT,
  channel_id TEXT REFERENCES channels(id),
  category "ContentCategory" NOT NULL,
  content_theme "ContentTheme",
  content_format "ContentFormat",
  assignee_id TEXT REFERENCES users(id),
  status "ContentStatus" NOT NULL DEFAULT 'PLANNED',
  scheduled_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_calendar_scheduled_date ON content_calendar_entries(scheduled_date);
CREATE INDEX idx_calendar_channel ON content_calendar_entries(channel_id);

-- Alerts
CREATE TABLE alerts (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  type "AlertType" NOT NULL,
  channel_id TEXT REFERENCES channels(id),
  campaign_id TEXT REFERENCES campaigns(id),
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);

-- Reports
CREATE TABLE reports (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  type "ReportType" NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  generated_by_id TEXT NOT NULL REFERENCES users(id),
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cadence Goals
CREATE TABLE cadence_goals (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  platform "ChannelPlatform" NOT NULL UNIQUE,
  posts_per_week INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alert Thresholds
CREATE TABLE alert_thresholds (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  metric_name TEXT NOT NULL UNIQUE,
  drop_percentage INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 4. TRIGGER para updated_at automático
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_calendar_updated_at BEFORE UPDATE ON content_calendar_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cadence_goals_updated_at BEFORE UPDATE ON cadence_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_alert_thresholds_updated_at BEFORE UPDATE ON alert_thresholds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadence_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_thresholds ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all data (same team)
-- Policy: Only ADMIN can write to users table
-- Policy: ADMIN and EDITOR can write to content tables

-- Users: everyone reads, only admin manages
CREATE POLICY "Users: read for authenticated" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users: admin manages" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN')
  );

-- Accounts: users manage their own
CREATE POLICY "Accounts: own records" ON accounts
  FOR ALL USING (user_id = auth.uid()::text);

-- Channels: read all, manage own
CREATE POLICY "Channels: read for authenticated" ON channels
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Channels: manage own" ON channels
  FOR ALL USING (user_id = auth.uid()::text);

-- Posts: read all
CREATE POLICY "Posts: read for authenticated" ON posts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Posts: admin/editor write" ON posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'EDITOR'))
  );

-- Metrics: read all
CREATE POLICY "Metrics: read for authenticated" ON metrics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Metrics: admin/editor write" ON metrics
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'EDITOR'))
  );

-- Campaigns: read all, admin/editor write
CREATE POLICY "Campaigns: read for authenticated" ON campaigns
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Campaigns: admin/editor write" ON campaigns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'EDITOR'))
  );

-- Campaign Metrics
CREATE POLICY "Campaign Metrics: read for authenticated" ON campaign_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Campaign Metrics: admin/editor write" ON campaign_metrics
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'EDITOR'))
  );

-- Funnel Stages: read all, admin writes
CREATE POLICY "Funnel Stages: read for authenticated" ON funnel_stages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Funnel Stages: admin write" ON funnel_stages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN')
  );

-- Leads: read all, admin/editor write
CREATE POLICY "Leads: read for authenticated" ON leads
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Leads: admin/editor write" ON leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'EDITOR'))
  );

-- Lead Events: read all, admin/editor write
CREATE POLICY "Lead Events: read for authenticated" ON lead_events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Lead Events: admin/editor write" ON lead_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'EDITOR'))
  );

-- Content Calendar: read all, admin/editor write
CREATE POLICY "Calendar: read for authenticated" ON content_calendar_entries
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Calendar: admin/editor write" ON content_calendar_entries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'EDITOR'))
  );

-- Alerts: read all, admin/editor write
CREATE POLICY "Alerts: read for authenticated" ON alerts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Alerts: admin/editor write" ON alerts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'EDITOR'))
  );

-- Reports: read all, admin/editor write
CREATE POLICY "Reports: read for authenticated" ON reports
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Reports: admin/editor write" ON reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'EDITOR'))
  );

-- Cadence Goals: read all, admin write
CREATE POLICY "Cadence Goals: read for authenticated" ON cadence_goals
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Cadence Goals: admin write" ON cadence_goals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN')
  );

-- Alert Thresholds: read all, admin write
CREATE POLICY "Alert Thresholds: read for authenticated" ON alert_thresholds
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Alert Thresholds: admin write" ON alert_thresholds
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN')
  );
