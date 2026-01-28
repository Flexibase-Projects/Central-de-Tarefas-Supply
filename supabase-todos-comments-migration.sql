-- Migration para adicionar tabelas de TODOs e atualizar Comments
-- Execute este script no SQL Editor do Supabase Dashboard

-- ============================================
-- 1. Tabela: project_todos (Checklist items)
-- ============================================
CREATE TABLE IF NOT EXISTS project_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_to UUID REFERENCES auth.users(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices para project_todos
CREATE INDEX IF NOT EXISTS idx_project_todos_project_id ON project_todos(project_id);
CREATE INDEX IF NOT EXISTS idx_project_todos_sort_order ON project_todos(project_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_project_todos_assigned_to ON project_todos(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_todos_completed ON project_todos(completed);

-- Trigger para atualizar updated_at em project_todos
DROP TRIGGER IF EXISTS update_project_todos_updated_at ON project_todos;
CREATE TRIGGER update_project_todos_updated_at BEFORE UPDATE ON project_todos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. Atualizar tabela comments (já existe, mas vamos garantir estrutura)
-- ============================================
-- A tabela comments já existe, mas vamos garantir que tenha os campos necessários
-- Se já existir, não causará erro

-- Adicionar campo para nome do autor (temporário até sistema de usuários)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_email VARCHAR(255);

-- Índices para comments (se não existirem)
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- ============================================
-- 3. Desabilitar RLS temporariamente
-- ============================================
ALTER TABLE project_todos DISABLE ROW LEVEL SECURITY;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
