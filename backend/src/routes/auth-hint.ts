import express from 'express';
import { supabase } from '../config/supabase.js';
import {
  isSupabaseConnectionRefused,
  SUPABASE_UNAVAILABLE_MESSAGE,
} from '../utils/supabase-errors.js';

const router = express.Router();

/** Indica se o email pode usar o fluxo "definir senha" na tela de login (convite com senha temporaria). */
router.post('/first-access-hint', async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    const normalized = String(email ?? '')
      .trim()
      .toLowerCase();
    if (!normalized) {
      return res.json({ eligible: false });
    }

    const { data, error } = await supabase
      .from('supply_users')
      .select('must_set_password')
      .eq('email', normalized)
      .maybeSingle();

    if (error) throw error;
    return res.json({ eligible: Boolean(data?.must_set_password) });
  } catch (error: unknown) {
    if (isSupabaseConnectionRefused(error)) {
      return res.status(503).json({ error: SUPABASE_UNAVAILABLE_MESSAGE });
    }
    console.error('first-access-hint:', error);
    return res.json({ eligible: false });
  }
});

/** Define a primeira senha forte; so permitido quando must_set_password esta true em supply_users. */
router.post('/set-initial-password', async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    const normalized = String(email ?? '')
      .trim()
      .toLowerCase();
    const pwd = String(password ?? '');

    if (!normalized || !pwd) {
      return res.status(400).json({ error: 'email e password sao obrigatorios' });
    }
    if (pwd.length < 8) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 8 caracteres.' });
    }

    const { data: row, error: rowError } = await supabase
      .from('supply_users')
      .select('id, must_set_password')
      .eq('email', normalized)
      .maybeSingle();

    if (rowError) throw rowError;
    if (!row?.id || !row.must_set_password) {
      return res.status(403).json({
        error: 'Este email nao esta elegivel para definir senha por aqui.',
      });
    }

    const { error: authError } = await supabase.auth.admin.updateUserById(row.id, {
      password: pwd,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message || 'Falha ao atualizar senha no Auth' });
    }

    const { error: updError } = await supabase
      .from('supply_users')
      .update({
        must_set_password: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    if (updError) throw updError;
    return res.json({ ok: true });
  } catch (error: unknown) {
    if (isSupabaseConnectionRefused(error)) {
      return res.status(503).json({ error: SUPABASE_UNAVAILABLE_MESSAGE });
    }
    console.error('set-initial-password:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Falha ao definir senha inicial',
    });
  }
});

export default router;
