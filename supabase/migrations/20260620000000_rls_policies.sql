-- PulseForge RLS Policies
-- Run this in Supabase SQL Editor after `prisma db push`

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE tones ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE publication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Helper: get user's workspace IDs
CREATE OR REPLACE FUNCTION user_workspace_ids()
RETURNS TABLE(workspace_id uuid)
LANGUAGE sql STABLE
AS $$
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid();
$$;

-- Users: only own row
CREATE POLICY "users_own" ON users
  FOR ALL USING (id = auth.uid());

-- Workspaces: member can read
CREATE POLICY "workspaces_read" ON workspaces
  FOR SELECT USING (id IN (SELECT workspace_id FROM user_workspace_ids()));

-- Workspace members: same workspace
CREATE POLICY "workspace_members_read" ON workspace_members
  FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM user_workspace_ids()));

-- Brand kits: workspace-scoped
CREATE POLICY "brand_kits_access" ON brand_kits
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM user_workspace_ids()));

-- Tones, Voice Rules, Personas: via brand kit
CREATE POLICY "tones_access" ON tones
  FOR ALL USING (brand_kit_id IN (SELECT id FROM brand_kits WHERE workspace_id IN (SELECT workspace_id FROM user_workspace_ids())));

CREATE POLICY "voice_rules_access" ON voice_rules
  FOR ALL USING (brand_kit_id IN (SELECT id FROM brand_kits WHERE workspace_id IN (SELECT workspace_id FROM user_workspace_ids())));

CREATE POLICY "personas_access" ON personas
  FOR ALL USING (brand_kit_id IN (SELECT id FROM brand_kits WHERE workspace_id IN (SELECT workspace_id FROM user_workspace_ids())));

-- Campaigns
CREATE POLICY "campaigns_access" ON campaigns
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM user_workspace_ids()));

-- Content items
CREATE POLICY "content_items_access" ON content_items
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM user_workspace_ids()));

-- Content versions
CREATE POLICY "content_versions_access" ON content_versions
  FOR ALL USING (content_id IN (SELECT id FROM content_items WHERE workspace_id IN (SELECT workspace_id FROM user_workspace_ids())));

-- Reviews: via content item
CREATE POLICY "reviews_access" ON reviews
  FOR ALL USING (content_item_id IN (SELECT id FROM content_items WHERE workspace_id IN (SELECT workspace_id FROM user_workspace_ids())));
CREATE POLICY "reviews_public_read" ON reviews
  FOR SELECT USING (true);  -- Public review by token

-- Topic suggestions
CREATE POLICY "topics_access" ON topic_suggestions
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM user_workspace_ids()));

-- Publication logs
CREATE POLICY "publication_logs_access" ON publication_logs
  FOR ALL USING (content_id IN (SELECT id FROM content_items WHERE workspace_id IN (SELECT workspace_id FROM user_workspace_ids())));

-- Integrations
CREATE POLICY "integrations_access" ON integrations
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM user_workspace_ids()));

-- Analytics data
CREATE POLICY "analytics_access" ON analytics_data
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM user_workspace_ids()));

-- Subscriptions
CREATE POLICY "subscriptions_access" ON subscriptions
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM user_workspace_ids()));

-- Audit logs
CREATE POLICY "audit_logs_access" ON audit_logs
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM user_workspace_ids()));

-- Recommendations
CREATE POLICY "recommendations_access" ON recommendations
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM user_workspace_ids()));

-- Webhook events: service role only (no RLS for public)
CREATE POLICY "webhook_events_service" ON webhook_events
  FOR ALL USING (auth.role() = 'service_role');

-- API keys
CREATE POLICY "api_keys_access" ON api_keys
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM user_workspace_ids()));

-- API key logs
CREATE POLICY "api_key_logs_access" ON api_key_logs
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM user_workspace_ids()));

-- User preferences
CREATE POLICY "user_preferences_own" ON user_preferences
  FOR ALL USING (user_id = auth.uid());

-- Content templates
CREATE POLICY "templates_access" ON content_templates
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM user_workspace_ids()));

-- Media
CREATE POLICY "media_access" ON media
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM user_workspace_ids()));
