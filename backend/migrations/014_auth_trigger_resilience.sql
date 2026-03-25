-- Evita que gatilhos legados no auth.users bloqueiem criacao de usuarios.
-- Mantem comportamento antigo quando possivel, mas nunca interrompe o insert no Auth.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, display_name, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, ''), '@', 1)),
      'user'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Nao bloquear criacao no Auth por falha em estrutura legada.
    NULL;
  END;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.tpm_handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  BEGIN
    INSERT INTO public."TPM_user_roles" (user_id, role)
    VALUES (NEW.id, 'usuario')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public."TPM_user_emails" (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  EXCEPTION WHEN OTHERS THEN
    -- Nao bloquear criacao no Auth por falha em estrutura legada.
    NULL;
  END;

  RETURN NEW;
END;
$$;
