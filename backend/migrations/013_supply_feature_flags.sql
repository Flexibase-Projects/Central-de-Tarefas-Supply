-- Feature flags para o sistema Supply (gamificação desativada por padrão)
CREATE TABLE IF NOT EXISTS supply_app_settings (
  key TEXT PRIMARY KEY,
  value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

INSERT INTO supply_app_settings (key, value_json)
VALUES ('gamification_enabled', '{"enabled": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE supply_app_settings DISABLE ROW LEVEL SECURITY;
