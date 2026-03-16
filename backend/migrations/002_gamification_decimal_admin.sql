-- ============================================================
-- Migration 002: Gamification decimals, rewards and idempotency
-- ============================================================

-- To-dos: XP decimal + deadline bonus percent
ALTER TABLE cdt_project_todos
  ALTER COLUMN xp_reward TYPE numeric(10,2) USING COALESCE(xp_reward, 1)::numeric(10,2),
  ALTER COLUMN xp_reward SET DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS deadline_bonus_percent numeric(5,2) NOT NULL DEFAULT 0.00;

-- Activities: XP decimal + deadline bonus percent
ALTER TABLE cdt_activities
  ALTER COLUMN xp_reward TYPE numeric(10,2) USING COALESCE(xp_reward, 1)::numeric(10,2),
  ALTER COLUMN xp_reward SET DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS deadline_bonus_percent numeric(5,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS achievement_id uuid DEFAULT NULL;

-- XP log: decimal precision
ALTER TABLE cdt_user_xp_log
  ALTER COLUMN xp_amount TYPE numeric(10,2) USING COALESCE(xp_amount, 0)::numeric(10,2),
  ALTER COLUMN xp_amount SET DEFAULT 0.00;

-- Achievements: dynamic reward and condition model
ALTER TABLE cdt_achievements
  ADD COLUMN IF NOT EXISTS reward_xp_fixed numeric(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS reward_percent numeric(5,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS condition_type text,
  ADD COLUMN IF NOT EXISTS condition_value numeric(10,2),
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'global_auto';

-- Backfill reward fixed from legacy xp_bonus when applicable
UPDATE cdt_achievements
SET reward_xp_fixed = COALESCE(reward_xp_fixed, xp_bonus::numeric(10,2), 0.00)
WHERE reward_xp_fixed = 0.00;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'cdt_achievements_mode_check'
  ) THEN
    ALTER TABLE cdt_achievements
      ADD CONSTRAINT cdt_achievements_mode_check
      CHECK (mode IN ('global_auto', 'linked_item', 'manual'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cdt_achievements_mode ON cdt_achievements(mode);
CREATE INDEX IF NOT EXISTS idx_cdt_achievements_condition_type ON cdt_achievements(condition_type);

-- Remove duplicated reward logs before unique index creation
WITH duplicated AS (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, reason, related_id, related_type
        ORDER BY created_at ASC, id ASC
      ) AS rn
    FROM cdt_user_xp_log
    WHERE related_id IS NOT NULL
      AND related_type IS NOT NULL
      AND reason IN ('todo_completed', 'activity_completed', 'achievement_unlocked')
  ) q
  WHERE q.rn > 1
)
DELETE FROM cdt_user_xp_log
WHERE id IN (SELECT id FROM duplicated);

CREATE UNIQUE INDEX IF NOT EXISTS ux_cdt_user_xp_log_event_once
  ON cdt_user_xp_log(user_id, reason, related_id, related_type)
  WHERE related_id IS NOT NULL
    AND related_type IS NOT NULL
    AND reason IN ('todo_completed', 'activity_completed', 'achievement_unlocked');
