-- Permissões de Kanban + INSIGHT e vínculos por papel (developer x viewer).
-- Corrige menu vazio para developer e restringe INSIGHT ao viewer “só Kanban”.

INSERT INTO supply_permissions (name, display_name, description, category) VALUES
  ('access_insight',          'Acessar Insight',            'Dashboard, mapa, prioridades e indicadores', 'insight'),
  ('access_desenvolvimentos', 'Acessar Kanban de Projetos', 'Tela de desenvolvimentos / projetos',       'ferramentas'),
  ('access_atividades',       'Acessar Kanban de Atividades', 'Tela de atividades',                     'ferramentas'),
  ('move_card',               'Mover cards no Kanban',      'Arrastar cards e ações ligadas ao fluxo',    'ferramentas')
ON CONFLICT (name) DO NOTHING;

-- Admin: todas as permissões (inclui as novas)
INSERT INTO supply_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM supply_roles r
CROSS JOIN supply_permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Developer (usuário): insight + kanban completo + gestão de projetos/tarefas/atividades
INSERT INTO supply_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM supply_roles r
JOIN supply_permissions p ON p.name IN (
  'access_insight',
  'access_desenvolvimentos',
  'access_atividades',
  'move_card',
  'manage_projects',
  'manage_tasks',
  'manage_activities'
)
WHERE r.name = 'developer'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Viewer: apenas entra nas telas de Kanban (sem mover, sem manage_*)
INSERT INTO supply_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM supply_roles r
JOIN supply_permissions p ON p.name IN (
  'access_desenvolvimentos',
  'access_atividades'
)
WHERE r.name = 'viewer'
ON CONFLICT (role_id, permission_id) DO NOTHING;
