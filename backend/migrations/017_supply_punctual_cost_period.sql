-- Custos variáveis: pontual (data única) ou período (valor total rateável por mês)
ALTER TABLE supply_department_punctual_costs
  ADD COLUMN IF NOT EXISTS timing_kind TEXT NOT NULL DEFAULT 'punctual';

ALTER TABLE supply_department_punctual_costs
  ADD COLUMN IF NOT EXISTS period_start_date DATE,
  ADD COLUMN IF NOT EXISTS period_end_date DATE;

UPDATE supply_department_punctual_costs
SET timing_kind = 'punctual'
WHERE timing_kind IS NULL OR timing_kind = '';

ALTER TABLE supply_department_punctual_costs
  DROP CONSTRAINT IF EXISTS supply_punctual_timing_kind_check;

ALTER TABLE supply_department_punctual_costs
  DROP CONSTRAINT IF EXISTS supply_punctual_timing_check;

ALTER TABLE supply_department_punctual_costs
  ADD CONSTRAINT supply_punctual_timing_kind_check
  CHECK (timing_kind IN ('punctual', 'period'));

ALTER TABLE supply_department_punctual_costs
  ADD CONSTRAINT supply_punctual_timing_check
  CHECK (
    (timing_kind = 'punctual' AND period_start_date IS NULL AND period_end_date IS NULL)
    OR (
      timing_kind = 'period'
      AND period_start_date IS NOT NULL
      AND period_end_date IS NOT NULL
      AND period_end_date >= period_start_date
    )
  );
