-- ============================================================
-- Migration 007: Todo assignment timestamp and reversible XP
-- ============================================================

ALTER TABLE cdt_project_todos
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz;

UPDATE cdt_project_todos
SET assigned_at = COALESCE(assigned_at, updated_at, created_at, now())
WHERE assigned_at IS NULL;

ALTER TABLE cdt_project_todos
  ALTER COLUMN assigned_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_cdt_project_todos_assigned_user_recent
  ON cdt_project_todos(assigned_to, assigned_at DESC);

DROP INDEX IF EXISTS ux_cdt_user_xp_log_event_once;

CREATE UNIQUE INDEX IF NOT EXISTS ux_cdt_user_xp_log_event_once_non_todo
  ON cdt_user_xp_log(user_id, reason, related_id, related_type)
  WHERE related_id IS NOT NULL
    AND related_type IS NOT NULL
    AND reason IN ('activity_completed', 'achievement_unlocked');

CREATE INDEX IF NOT EXISTS idx_cdt_user_xp_log_todo_cycles
  ON cdt_user_xp_log(user_id, related_id, created_at DESC)
  WHERE related_type = 'todo'
    AND reason IN ('todo_completed', 'todo_uncompleted');
