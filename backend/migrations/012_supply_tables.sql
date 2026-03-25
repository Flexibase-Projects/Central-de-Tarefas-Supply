-- ============================================================
-- Migration 012: Supply Chain Tables
-- Tabelas isoladas para o sistema Central de Tarefas Supply
-- Espelho das tabelas cdt_* com prefixo supply_
-- Compartilha o mesmo projeto Supabase, dados 100% isolados.
-- ============================================================

-- Função reutilizável (idempotente)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. supply_users (perfis dos usuários do Supply)
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  avatar_url    TEXT,
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  must_set_password BOOLEAN  NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ  DEFAULT now(),
  updated_at    TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supply_users_email    ON supply_users(email);
CREATE INDEX IF NOT EXISTS idx_supply_users_is_active ON supply_users(is_active);

DROP TRIGGER IF EXISTS update_supply_users_updated_at ON supply_users;
CREATE TRIGGER update_supply_users_updated_at
  BEFORE UPDATE ON supply_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. supply_roles
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_roles (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(50)  NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ  DEFAULT now(),
  updated_at   TIMESTAMPTZ  DEFAULT now()
);

DROP TRIGGER IF EXISTS update_supply_roles_updated_at ON supply_roles;
CREATE TRIGGER update_supply_roles_updated_at
  BEFORE UPDATE ON supply_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed: papéis padrão
INSERT INTO supply_roles (name, display_name, description) VALUES
  ('admin',     'Administrador', 'Acesso total ao sistema Supply'),
  ('developer', 'Usuário',       'Usuário padrão do Supply Chain'),
  ('viewer',    'Visualizador',  'Apenas leitura no Supply')
ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name;

-- ============================================================
-- 3. supply_permissions
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_permissions (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(150) NOT NULL,
  description  TEXT,
  category     VARCHAR(50)  NOT NULL DEFAULT 'general',
  created_at   TIMESTAMPTZ  DEFAULT now()
);

-- Seed: permissões padrão
INSERT INTO supply_permissions (name, display_name, description, category) VALUES
  ('manage_projects',        'Gerenciar Projetos',         'Criar/editar/excluir projetos',          'projetos'),
  ('manage_tasks',           'Gerenciar Tarefas',          'Criar/editar/excluir tarefas',           'tarefas'),
  ('manage_activities',      'Gerenciar Atividades',       'Criar/editar/excluir atividades',        'atividades'),
  ('manage_users',           'Gerenciar Usuários',         'Convidar e gerenciar membros',           'usuarios'),
  ('manage_roles',           'Gerenciar Papéis',           'Atribuir papéis a usuários',             'usuarios'),
  ('view_costs',             'Ver Custos',                 'Visualizar dados de custos',             'custos'),
  ('manage_costs',           'Gerenciar Custos',           'Criar/editar itens de custo',            'custos'),
  ('view_indicators',        'Ver Indicadores',            'Acessar dashboard de indicadores',       'indicadores'),
  ('manage_departments',     'Gerenciar Departamentos',    'Criar/editar departamentos',             'departamentos'),
  ('access_canva_equipe',    'Acessar Canva em Equipe',    'Usar o quadro colaborativo',             'ferramentas'),
  ('view_org_chart',         'Ver Organograma',            'Visualizar organograma Supply Chain',    'org')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 4. supply_role_permissions
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_role_permissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id       UUID NOT NULL REFERENCES supply_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES supply_permissions(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_supply_role_perm_role ON supply_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_supply_role_perm_perm ON supply_role_permissions(permission_id);

-- Seed: admin tem todas as permissões
INSERT INTO supply_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM supply_roles r
CROSS JOIN supply_permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================
-- 5. supply_user_roles
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES supply_users(id) ON DELETE CASCADE,
  role_id     UUID NOT NULL REFERENCES supply_roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_supply_user_roles_user ON supply_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_supply_user_roles_role ON supply_user_roles(role_id);

-- ============================================================
-- 6. supply_projects
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_projects (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  status         VARCHAR(20)  NOT NULL DEFAULT 'backlog',
  github_url     TEXT,
  github_owner   VARCHAR(255),
  github_repo    VARCHAR(255),
  project_url    TEXT,
  map_quadrant   SMALLINT,
  map_x          NUMERIC(5,2),
  map_y          NUMERIC(5,2),
  priority_order INTEGER,
  created_at     TIMESTAMPTZ  DEFAULT now(),
  updated_at     TIMESTAMPTZ  DEFAULT now(),
  created_by     UUID         REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_supply_projects_status         ON supply_projects(status);
CREATE INDEX IF NOT EXISTS idx_supply_projects_created_at     ON supply_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supply_projects_github         ON supply_projects(github_owner, github_repo);
CREATE INDEX IF NOT EXISTS idx_supply_projects_priority_order ON supply_projects(priority_order ASC NULLS LAST);

DROP TRIGGER IF EXISTS update_supply_projects_updated_at ON supply_projects;
CREATE TRIGGER update_supply_projects_updated_at
  BEFORE UPDATE ON supply_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. supply_tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_tasks (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID         NOT NULL REFERENCES supply_projects(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  status      VARCHAR(20)  NOT NULL DEFAULT 'todo',
  priority    VARCHAR(10)  NOT NULL DEFAULT 'medium',
  assigned_to UUID         REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ  DEFAULT now(),
  updated_at  TIMESTAMPTZ  DEFAULT now(),
  created_by  UUID         REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_supply_tasks_project    ON supply_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_supply_tasks_status     ON supply_tasks(status);
CREATE INDEX IF NOT EXISTS idx_supply_tasks_assigned   ON supply_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_supply_tasks_priority   ON supply_tasks(priority);

DROP TRIGGER IF EXISTS update_supply_tasks_updated_at ON supply_tasks;
CREATE TRIGGER update_supply_tasks_updated_at
  BEFORE UPDATE ON supply_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. supply_activities
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_activities (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  VARCHAR(255)  NOT NULL,
  description           TEXT,
  status                VARCHAR(20)   NOT NULL DEFAULT 'backlog',
  due_date              TIMESTAMPTZ,
  priority              VARCHAR(10)   NOT NULL DEFAULT 'medium',
  assigned_to           UUID          REFERENCES auth.users(id),
  cover_image_url       TEXT,
  xp_reward             NUMERIC(10,2) NOT NULL DEFAULT 1.00,
  completed_at          TIMESTAMPTZ,
  deadline_bonus_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  achievement_id        UUID,
  created_at            TIMESTAMPTZ   DEFAULT now(),
  updated_at            TIMESTAMPTZ   DEFAULT now(),
  created_by            UUID          REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_supply_activities_status      ON supply_activities(status);
CREATE INDEX IF NOT EXISTS idx_supply_activities_created_at  ON supply_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supply_activities_assigned    ON supply_activities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_supply_activities_priority    ON supply_activities(priority);
CREATE INDEX IF NOT EXISTS idx_supply_activities_due_date    ON supply_activities(due_date);

DROP TRIGGER IF EXISTS update_supply_activities_updated_at ON supply_activities;
CREATE TRIGGER update_supply_activities_updated_at
  BEFORE UPDATE ON supply_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. supply_comments
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_comments (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID         REFERENCES supply_projects(id) ON DELETE CASCADE,
  task_id      UUID         REFERENCES supply_tasks(id) ON DELETE CASCADE,
  activity_id  UUID         REFERENCES supply_activities(id) ON DELETE CASCADE,
  content      TEXT         NOT NULL,
  author_name  VARCHAR(255),
  author_email VARCHAR(255),
  created_at   TIMESTAMPTZ  DEFAULT now(),
  created_by   UUID         REFERENCES auth.users(id),
  CONSTRAINT supply_comments_one_parent CHECK (
    (project_id IS NOT NULL AND task_id IS NULL  AND activity_id IS NULL) OR
    (project_id IS NULL  AND task_id IS NOT NULL AND activity_id IS NULL) OR
    (project_id IS NULL  AND task_id IS NULL     AND activity_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_supply_comments_project    ON supply_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_supply_comments_task       ON supply_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_supply_comments_activity   ON supply_comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_supply_comments_created_at ON supply_comments(created_at DESC);

-- ============================================================
-- 10. supply_project_assignments
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_project_assignments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID        NOT NULL REFERENCES supply_projects(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       VARCHAR(20) NOT NULL DEFAULT 'developer',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_supply_proj_assign_project ON supply_project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_supply_proj_assign_user    ON supply_project_assignments(user_id);

-- ============================================================
-- 11. supply_achievements
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_achievements (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT          NOT NULL UNIQUE,
  name              TEXT          NOT NULL,
  description       TEXT          NOT NULL DEFAULT '',
  icon              TEXT          NOT NULL DEFAULT 'star',
  category          TEXT          NOT NULL DEFAULT 'misc',
  rarity            TEXT          NOT NULL DEFAULT 'common',
  xp_bonus          INTEGER       NOT NULL DEFAULT 0,
  reward_xp_fixed   NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  reward_percent    NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
  condition_type    TEXT,
  condition_value   NUMERIC(10,2),
  mode              TEXT          NOT NULL DEFAULT 'global_auto'
    CHECK (mode IN ('global_auto', 'linked_item', 'manual')),
  is_active         BOOLEAN       NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supply_achievements_slug          ON supply_achievements(slug);
CREATE INDEX IF NOT EXISTS idx_supply_achievements_is_active     ON supply_achievements(is_active);
CREATE INDEX IF NOT EXISTS idx_supply_achievements_category      ON supply_achievements(category);
CREATE INDEX IF NOT EXISTS idx_supply_achievements_mode          ON supply_achievements(mode);

-- ============================================================
-- 12. supply_user_achievements
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_user_achievements (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL,
  achievement_id UUID        NOT NULL REFERENCES supply_achievements(id) ON DELETE CASCADE,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_supply_user_achiev_user ON supply_user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_supply_user_achiev_achiev ON supply_user_achievements(achievement_id);

-- ============================================================
-- 13. supply_user_xp_log
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_user_xp_log (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID          NOT NULL,
  xp_amount    NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  reason       TEXT          NOT NULL DEFAULT '',
  related_id   UUID,
  related_type TEXT,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supply_xp_log_user    ON supply_user_xp_log(user_id);
CREATE INDEX IF NOT EXISTS idx_supply_xp_log_created ON supply_user_xp_log(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_supply_xp_log_event_non_todo
  ON supply_user_xp_log(user_id, reason, related_id, related_type)
  WHERE related_id IS NOT NULL
    AND related_type IS NOT NULL
    AND reason IN ('activity_completed', 'achievement_unlocked');

CREATE INDEX IF NOT EXISTS idx_supply_xp_log_todo_cycles
  ON supply_user_xp_log(user_id, related_id, created_at DESC)
  WHERE related_type = 'todo'
    AND reason IN ('todo_completed', 'todo_uncompleted');

-- ============================================================
-- 14. supply_project_todos
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_project_todos (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID          REFERENCES supply_projects(id) ON DELETE CASCADE,
  activity_id           UUID          REFERENCES supply_activities(id) ON DELETE CASCADE,
  title                 VARCHAR(500)  NOT NULL,
  completed             BOOLEAN       NOT NULL DEFAULT false,
  assigned_to           UUID          REFERENCES auth.users(id),
  sort_order            INTEGER       NOT NULL DEFAULT 0,
  xp_reward             NUMERIC(10,2) NOT NULL DEFAULT 1.00,
  deadline              DATE,
  achievement_id        UUID,
  completed_at          TIMESTAMPTZ,
  deadline_bonus_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  assigned_at           TIMESTAMPTZ   DEFAULT now(),
  created_at            TIMESTAMPTZ   DEFAULT now(),
  updated_at            TIMESTAMPTZ   DEFAULT now(),
  created_by            UUID          REFERENCES auth.users(id),
  CONSTRAINT supply_project_todos_one_scope CHECK (
    (project_id IS NOT NULL AND activity_id IS NULL) OR
    (project_id IS NULL  AND activity_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_supply_todos_project   ON supply_project_todos(project_id);
CREATE INDEX IF NOT EXISTS idx_supply_todos_activity  ON supply_project_todos(activity_id);
CREATE INDEX IF NOT EXISTS idx_supply_todos_assigned  ON supply_project_todos(assigned_to, assigned_at DESC);

DROP TRIGGER IF EXISTS update_supply_project_todos_updated_at ON supply_project_todos;
CREATE TRIGGER update_supply_project_todos_updated_at
  BEFORE UPDATE ON supply_project_todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 15. supply_notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_notifications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES supply_users(id) ON DELETE CASCADE,
  type         VARCHAR(50) NOT NULL DEFAULT 'todo_assigned',
  title        VARCHAR(255) NOT NULL,
  message      TEXT,
  related_id   UUID,
  related_type VARCHAR(50),
  project_id   UUID        REFERENCES supply_projects(id) ON DELETE SET NULL,
  read         BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supply_notif_user    ON supply_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_supply_notif_project ON supply_notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_supply_notif_read    ON supply_notifications(user_id, read);

-- ============================================================
-- 16. supply_team_canvas
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_team_canvas (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL DEFAULT 'default',
  content    JSONB        NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ  DEFAULT now(),
  updated_at TIMESTAMPTZ  DEFAULT now(),
  created_by UUID         REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_supply_team_canvas_name ON supply_team_canvas(name);
CREATE INDEX IF NOT EXISTS idx_supply_team_canvas_updated_at ON supply_team_canvas(updated_at DESC);

DROP TRIGGER IF EXISTS update_supply_team_canvas_updated_at ON supply_team_canvas;
CREATE TRIGGER update_supply_team_canvas_updated_at
  BEFORE UPDATE ON supply_team_canvas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 17. supply_departments
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_departments (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supply_departments_name ON supply_departments(name);

DROP TRIGGER IF EXISTS update_supply_departments_updated_at ON supply_departments;
CREATE TRIGGER update_supply_departments_updated_at
  BEFORE UPDATE ON supply_departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 18. supply_cost_items
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_cost_items (
  id                        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      VARCHAR(255)  NOT NULL,
  description               TEXT,
  amount                    NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency                  VARCHAR(10)   NOT NULL DEFAULT 'BRL',
  status                    VARCHAR(20)   NOT NULL DEFAULT 'analise'
    CHECK (status IN ('analise', 'ativo', 'desativado', 'cancelado')),
  is_active                 BOOLEAN       NOT NULL DEFAULT true,
  category                  VARCHAR(40)   NOT NULL DEFAULT 'outro'
    CHECK (category IN ('ferramenta', 'licenca', 'infraestrutura', 'servico', 'outro')),
  activities_description    TEXT,
  result_savings_description TEXT,
  result_savings_amount     NUMERIC(14,2),
  created_at                TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supply_cost_items_status    ON supply_cost_items(status);
CREATE INDEX IF NOT EXISTS idx_supply_cost_items_is_active ON supply_cost_items(is_active);

DROP TRIGGER IF EXISTS update_supply_cost_items_updated_at ON supply_cost_items;
CREATE TRIGGER update_supply_cost_items_updated_at
  BEFORE UPDATE ON supply_cost_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 19. supply_department_costs
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_department_costs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID        NOT NULL REFERENCES supply_departments(id) ON DELETE CASCADE,
  cost_id       UUID        NOT NULL REFERENCES supply_cost_items(id)  ON DELETE CASCADE,
  link_status   VARCHAR(20) DEFAULT 'ativo'
    CHECK (link_status IS NULL OR link_status IN ('ativo', 'cancelado')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(department_id, cost_id)
);

CREATE INDEX IF NOT EXISTS idx_supply_dept_costs_dept ON supply_department_costs(department_id);
CREATE INDEX IF NOT EXISTS idx_supply_dept_costs_cost ON supply_department_costs(cost_id);

-- ============================================================
-- 20. supply_department_members
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_department_members (
  id                     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id          UUID          NOT NULL REFERENCES supply_departments(id) ON DELETE CASCADE,
  user_id                UUID          NOT NULL REFERENCES supply_users(id) ON DELETE CASCADE,
  individual_monthly_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  role_label             VARCHAR(255),
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE(department_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_supply_dept_members_dept ON supply_department_members(department_id);
CREATE INDEX IF NOT EXISTS idx_supply_dept_members_user ON supply_department_members(user_id);

DROP TRIGGER IF EXISTS update_supply_dept_members_updated_at ON supply_department_members;
CREATE TRIGGER update_supply_dept_members_updated_at
  BEFORE UPDATE ON supply_department_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 21. supply_person_cost_allocations
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_person_cost_allocations (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID          NOT NULL REFERENCES supply_departments(id) ON DELETE CASCADE,
  user_id       UUID          NOT NULL REFERENCES supply_users(id) ON DELETE CASCADE,
  cost_id       UUID          NOT NULL REFERENCES supply_cost_items(id) ON DELETE CASCADE,
  allocation_pct NUMERIC(5,2) CHECK (allocation_pct IS NULL OR (allocation_pct >= 0 AND allocation_pct <= 100)),
  amount        NUMERIC(14,2),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE(department_id, user_id, cost_id)
);

CREATE INDEX IF NOT EXISTS idx_supply_person_cost_alloc_cost ON supply_person_cost_allocations(cost_id);

-- ============================================================
-- 22. supply_cost_map_layout
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_cost_map_layout (
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('department', 'cost', 'person')),
  entity_id   UUID        NOT NULL,
  position_x  DOUBLE PRECISION NOT NULL DEFAULT 0,
  position_y  DOUBLE PRECISION NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_type, entity_id)
);

-- ============================================================
-- 23. supply_user_org
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_user_org (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name   VARCHAR(255)  NOT NULL,
  reports_to_id UUID          REFERENCES supply_user_org(id) ON DELETE SET NULL,
  job_title     VARCHAR(255),
  display_order INT           NOT NULL DEFAULT 0,
  department_id UUID          REFERENCES supply_departments(id) ON DELETE SET NULL,
  monthly_salary NUMERIC(14,2),
  monthly_cost   NUMERIC(14,2),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT supply_user_org_no_self_report CHECK (reports_to_id IS NULL OR reports_to_id <> id)
);

CREATE INDEX IF NOT EXISTS idx_supply_user_org_reports_to ON supply_user_org(reports_to_id);
CREATE INDEX IF NOT EXISTS idx_supply_user_org_dept        ON supply_user_org(department_id);

DROP TRIGGER IF EXISTS update_supply_user_org_updated_at ON supply_user_org;
CREATE TRIGGER update_supply_user_org_updated_at
  BEFORE UPDATE ON supply_user_org
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 24. supply_github_repositories (cache GitHub)
-- ============================================================
CREATE TABLE IF NOT EXISTS supply_github_repositories (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  owner              VARCHAR(255)  NOT NULL,
  repo               VARCHAR(255)  NOT NULL,
  full_name          VARCHAR(500)  NOT NULL,
  description        TEXT,
  language           VARCHAR(100),
  stargazers_count   INTEGER       DEFAULT 0,
  forks_count        INTEGER       DEFAULT 0,
  open_issues_count  INTEGER       DEFAULT 0,
  default_branch     VARCHAR(100),
  html_url           TEXT          NOT NULL,
  cached_at          TIMESTAMPTZ   DEFAULT now(),
  UNIQUE(owner, repo)
);

CREATE INDEX IF NOT EXISTS idx_supply_github_repos_owner ON supply_github_repositories(owner, repo);
CREATE INDEX IF NOT EXISTS idx_supply_github_repos_cached ON supply_github_repositories(cached_at DESC);

-- ============================================================
-- RLS: desabilitar para desenvolvimento (espelha comportamento cdt_*)
-- Habilitar e criar políticas quando autenticação estiver validada.
-- ============================================================
ALTER TABLE supply_users                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_roles                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_permissions            DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_role_permissions       DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_user_roles             DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_projects               DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_tasks                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_activities             DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_comments               DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_project_assignments    DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_achievements           DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_user_achievements      DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_user_xp_log            DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_project_todos          DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_notifications          DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_team_canvas            DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_departments            DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_cost_items             DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_department_costs       DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_department_members     DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_person_cost_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_cost_map_layout        DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_user_org               DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_github_repositories    DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- FIM DA MIGRATION 012
-- ============================================================
