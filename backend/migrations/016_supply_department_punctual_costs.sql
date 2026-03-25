-- Custos pontuais por departamento (valor em data específica, não recorrente)
CREATE TABLE IF NOT EXISTS supply_department_punctual_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES supply_departments(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'BRL',
  reference_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supply_punctual_dept ON supply_department_punctual_costs(department_id);
CREATE INDEX IF NOT EXISTS idx_supply_punctual_ref_date ON supply_department_punctual_costs(reference_date);

DROP TRIGGER IF EXISTS update_supply_department_punctual_costs_updated_at ON supply_department_punctual_costs;
CREATE TRIGGER update_supply_department_punctual_costs_updated_at
  BEFORE UPDATE ON supply_department_punctual_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
