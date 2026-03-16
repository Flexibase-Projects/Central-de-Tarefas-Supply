-- ============================================================
-- Migration 001: Gamification
-- Run this in the Supabase SQL editor (or psql) once.
-- All statements use IF NOT EXISTS / IF EXISTS so they are
-- safe to re-run without side-effects.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Extend cdt_project_todos
-- ────────────────────────────────────────────────────────────

ALTER TABLE cdt_project_todos
  ADD COLUMN IF NOT EXISTS xp_reward      integer     NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS deadline       date        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS achievement_id uuid        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS completed_at   timestamptz DEFAULT NULL;

-- ────────────────────────────────────────────────────────────
-- 2. Extend cdt_activities
-- ────────────────────────────────────────────────────────────

ALTER TABLE cdt_activities
  ADD COLUMN IF NOT EXISTS xp_reward    integer     NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz DEFAULT NULL;

-- ────────────────────────────────────────────────────────────
-- 3. cdt_achievements  (master catalogue)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cdt_achievements (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text        NOT NULL UNIQUE,
  name        text        NOT NULL,
  description text        NOT NULL DEFAULT '',
  icon        text        NOT NULL DEFAULT 'star',
  category    text        NOT NULL DEFAULT 'misc',
  rarity      text        NOT NULL DEFAULT 'common',
  xp_bonus    integer     NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cdt_achievements_slug      ON cdt_achievements(slug);
CREATE INDEX IF NOT EXISTS idx_cdt_achievements_is_active ON cdt_achievements(is_active);
CREATE INDEX IF NOT EXISTS idx_cdt_achievements_category  ON cdt_achievements(category);

-- ────────────────────────────────────────────────────────────
-- 4. cdt_user_achievements  (junction: which users unlocked what)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cdt_user_achievements (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL,
  achievement_id uuid        NOT NULL REFERENCES cdt_achievements(id) ON DELETE CASCADE,
  unlocked_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_cdt_user_achievements_user_id        ON cdt_user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_cdt_user_achievements_achievement_id ON cdt_user_achievements(achievement_id);

-- ────────────────────────────────────────────────────────────
-- 5. cdt_user_xp_log  (event log for XP earned)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cdt_user_xp_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL,
  xp_amount   integer     NOT NULL DEFAULT 0,
  reason      text        NOT NULL DEFAULT '',   -- e.g. 'todo_completed', 'achievement_unlocked'
  related_id  uuid        DEFAULT NULL,           -- optional: id of todo/activity/achievement
  related_type text       DEFAULT NULL,           -- e.g. 'todo', 'activity', 'achievement'
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cdt_user_xp_log_user_id    ON cdt_user_xp_log(user_id);
CREATE INDEX IF NOT EXISTS idx_cdt_user_xp_log_created_at ON cdt_user_xp_log(created_at DESC);

-- ────────────────────────────────────────────────────────────
-- 6. Seed cdt_achievements with the 50 preset achievements
--    Uses INSERT … ON CONFLICT DO UPDATE to keep name/description
--    in sync on re-runs without duplicating rows.
-- ────────────────────────────────────────────────────────────

INSERT INTO cdt_achievements (slug, name, description, icon, category, rarity, xp_bonus) VALUES

-- productivity (todos)
('first_todo',          'Primeira Missão',       'Conclua seu primeiro to-do.',              'check_circle',    'productivity', 'common',    5),
('five_todos',          'Em Ritmo',              'Conclua 5 to-dos.',                        'task_alt',        'productivity', 'common',   10),
('ten_todos',           'Produtivo',             'Conclua 10 to-dos.',                       'stars',           'productivity', 'common',   15),
('twentyfive_todos',    'Máquina de Tarefas',    'Conclua 25 to-dos.',                       'bolt',            'productivity', 'rare',     25),
('hundred_todos',       'Centurião',             'Conclua 100 to-dos.',                      'military_tech',   'productivity', 'epic',     50),
('twofifty_todos',      'Lendário da Lista',     'Conclua 250 to-dos.',                      'emoji_events',    'productivity', 'legendary',100),
('deadline_first',      'Prazo Cumprido',        'Conclua um to-do antes do prazo.',         'timer',           'productivity', 'common',   10),
('deadline_five',       'Pontualidade',          'Conclua 5 to-dos antes do prazo.',         'schedule',        'productivity', 'rare',     25),
('deadline_twenty',     'Sem Atrasos',           'Conclua 20 to-dos antes do prazo.',        'alarm_on',        'productivity', 'epic',     50),

-- activities
('first_activity',          'Primeira Atividade',        'Conclua sua primeira atividade.',              'flag',              'activities', 'common',    10),
('five_activities',         'Executor',                  'Conclua 5 atividades.',                        'play_circle',       'activities', 'common',    15),
('fifteen_activities',      'Especialista',              'Conclua 15 atividades.',                       'workspace_premium', 'activities', 'rare',      30),
('thirty_activities',       'Veterano',                  'Conclua 30 atividades.',                       'verified',          'activities', 'epic',      60),
('fifty_activities',        'Mestre das Atividades',     'Conclua 50 atividades.',                       'auto_awesome',      'activities', 'legendary', 120),
('activity_deadline_first', 'Atividade Relâmpago',       'Conclua uma atividade antes do prazo.',        'flash_on',          'activities', 'common',    15),
('activity_deadline_ten',   'Sem Pendências',            'Conclua 10 atividades antes do prazo.',        'done_all',          'activities', 'rare',      40),

-- milestone
('level_5',           'Nível 5',       'Alcance o nível 5.',                                    'looks_5',      'milestone', 'common',     10),
('uranium_unlocked',  'Uranizado',     'Alcance o nível 6 — tier Uranium desbloqueado!',         'science',      'milestone', 'rare',       20),
('level_10',          'Nível 10',      'Alcance o nível 10.',                                   'looks_10',     'milestone', 'rare',       30),
('platinum_unlocked', 'Platinado',     'Alcance o nível 11 — tier Platinum desbloqueado!',       'diamond',      'milestone', 'epic',       50),
('level_15',          'Nível 15',      'Alcance o nível 15.',                                   'star',         'milestone', 'epic',       50),
('flexibase_unlocked','FlexiBase',     'Alcance o nível 16 — tier FlexiBase desbloqueado!',      'electric_bolt','milestone', 'legendary', 100),
('level_20',          'Nível 20',      'Alcance o nível 20 — nível máximo!',                    'crown',        'milestone', 'legendary', 200),
('xp_500',            'XP 500',        'Acumule 500 XP total.',                                 'bar_chart',    'milestone', 'rare',       20),
('xp_1000',           'XP 1000',       'Acumule 1000 XP total.',                                'trending_up',  'milestone', 'epic',       50),

-- streak
('streak_2',  'Dois Dias Seguidos', 'Conclua tarefas em 2 dias consecutivos.', 'local_fire_department', 'streak', 'common',    10),
('streak_7',  'Semana Produtiva',   'Streak de 7 dias.',                       'whatshot',              'streak', 'rare',      30),
('streak_15', 'Quinzena Forte',     'Streak de 15 dias.',                      'flare',                 'streak', 'epic',      60),
('streak_30', 'Mês Impecável',      'Streak de 30 dias.',                      'stars',                 'streak', 'legendary', 150),

-- collaboration
('first_comment',        'Primeiro Comentário', 'Poste seu primeiro comentário.',  'chat',              'collaboration', 'common',  5),
('ten_comments',         'Discussão Ativa',     'Poste 10 comentários.',           'forum',             'collaboration', 'common',  10),
('twentyfive_comments',  'Voz do Time',         'Poste 25 comentários.',           'record_voice_over', 'collaboration', 'rare',    25),

-- challenge
('challenge_first', 'Desafio Aceitador',    'Conclua 1 to-do desafio.',    'sports_score',     'challenge', 'rare',      30),
('challenge_five',  'Desafiante',           'Conclua 5 to-dos desafio.',   'gps_fixed',        'challenge', 'epic',      75),
('challenge_ten',   'Mestre dos Desafios',  'Conclua 10 to-dos desafio.',  'workspace_premium','challenge', 'legendary', 150),

-- misc
('eisenhower_3',    'Mapa Estratégico',   'Posicione 3 itens no Mapa Eisenhower.',               'map',           'misc', 'common',  10),
('eisenhower_all',  'Estrategista',       'Preencha todos os 4 quadrantes do Mapa.',              'grid_4x4',      'misc', 'rare',    25),
('canvas_first',    'Canva do Time',      'Faça sua primeira edição no Canva em Equipe.',         'brush',         'misc', 'common',  10),
('canvas_ten',      'Artista Colaborativo','Faça 10 edições no Canva em Equipe.',                 'palette',       'misc', 'rare',    25),
('profile_complete','Perfil Completo',    'Preencha seu nome e avatar no perfil.',                'account_circle','misc', 'common',  15),
('early_bird',      'Madrugador',         'Conclua uma tarefa antes das 8h.',                    'wb_sunny',      'misc', 'rare',    20),
('night_owl',       'Coruja da Noite',    'Conclua uma tarefa após as 22h.',                     'nights_stay',   'misc', 'rare',    20),

-- projects
('first_project',     'Primeiro Projeto',     'Participe do seu primeiro projeto.',             'folder',       'projects', 'common',   10),
('five_projects',     'Multi-Projeto',        'Participe de 5 projetos.',                       'folder_open',  'projects', 'rare',     25),
('ten_projects',      'Portfólio Completo',   'Participe de 10 projetos.',                      'inventory_2',  'projects', 'epic',     50),
('github_integrated', 'Código Comprometido',  'Vincule um repositório GitHub a um projeto.',    'code',         'projects', 'common',   15),
('three_github',      'Dev Integrado',        'Vincule GitHub a 3 projetos.',                   'hub',          'projects', 'rare',     30),
('pioneer',           'Pioneiro',             'Seja o primeiro a concluir um projeto compartilhado.', 'rocket_launch','projects', 'legendary', 200)

ON CONFLICT (slug) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  icon        = EXCLUDED.icon,
  category    = EXCLUDED.category,
  rarity      = EXCLUDED.rarity,
  xp_bonus    = EXCLUDED.xp_bonus,
  updated_at  = now();

-- ────────────────────────────────────────────────────────────
-- 7. Row Level Security (RLS) — recommended settings
--    Enable on all new tables. Policies allow users to read/write
--    only their own rows.  Adjust to taste.
-- ────────────────────────────────────────────────────────────

ALTER TABLE cdt_achievements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cdt_user_achievements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cdt_user_xp_log        ENABLE ROW LEVEL SECURITY;

-- cdt_achievements: everyone can read active achievements (public catalogue)
DROP POLICY IF EXISTS "achievements_select_all" ON cdt_achievements;
CREATE POLICY "achievements_select_all"
  ON cdt_achievements FOR SELECT
  USING (is_active = true);

-- cdt_user_achievements: users can read their own unlocked achievements
DROP POLICY IF EXISTS "user_achievements_select_own" ON cdt_user_achievements;
CREATE POLICY "user_achievements_select_own"
  ON cdt_user_achievements FOR SELECT
  USING (user_id = auth.uid());

-- cdt_user_achievements: users can insert their own (unlock event)
DROP POLICY IF EXISTS "user_achievements_insert_own" ON cdt_user_achievements;
CREATE POLICY "user_achievements_insert_own"
  ON cdt_user_achievements FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- cdt_user_xp_log: users can read their own log
DROP POLICY IF EXISTS "user_xp_log_select_own" ON cdt_user_xp_log;
CREATE POLICY "user_xp_log_select_own"
  ON cdt_user_xp_log FOR SELECT
  USING (user_id = auth.uid());

-- cdt_user_xp_log: users can insert their own log entries
DROP POLICY IF EXISTS "user_xp_log_insert_own" ON cdt_user_xp_log;
CREATE POLICY "user_xp_log_insert_own"
  ON cdt_user_xp_log FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- End of migration 001
-- ────────────────────────────────────────────────────────────
