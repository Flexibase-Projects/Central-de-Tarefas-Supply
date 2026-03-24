-- Primeiro acesso: forçar troca de senha após convite com senha temporária.
ALTER TABLE cdt_users
  ADD COLUMN IF NOT EXISTS must_set_password boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN cdt_users.must_set_password IS 'Quando true, o login deve orientar troca de senha (convite manual).';
