-- Migração: Adicionar tabela de atividades
-- Execute este script no SQL Editor do Supabase Dashboard
-- Este script adiciona apenas a tabela de atividades ao schema existente

-- ============================================
-- Tabela: activities
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'backlog',
  due_date TIMESTAMP WITH TIME ZONE,
  priority VARCHAR(10) NOT NULL DEFAULT 'medium',
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices para activities
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_assigned_to ON activities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_activities_priority ON activities(priority);
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON activities(due_date);

-- Trigger para atualizar updated_at em activities
DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Desabilitar RLS temporariamente para desenvolvimento
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================
-- Após executar este script, a tabela 'activities' estará criada e pronta para uso.
-- Você pode verificar a tabela no Supabase Dashboard > Table Editor
