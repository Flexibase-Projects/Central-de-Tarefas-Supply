import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

/** Define em req o id do usuário autenticado (x-user-id) a partir do JWT do Supabase Auth. */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    next();
    return;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      next();
      return;
    }

    // Resolver cdt_users: prioridade por id (auth = cdt) e depois por email (conta já existente)
    const byId = await supabase.from('cdt_users').select('id').eq('id', user.id).single();
    if (byId.data?.id) {
      (req as Request & { userId?: string }).userId = byId.data.id;
      req.headers['x-user-id'] = byId.data.id;
      next();
      return;
    }
    if (user.email) {
      const byEmail = await supabase.from('cdt_users').select('id').eq('email', user.email).maybeSingle();
      if (byEmail.data?.id) {
        (req as Request & { userId?: string }).userId = byEmail.data.id;
        req.headers['x-user-id'] = byEmail.data.id;
        next();
        return;
      }
    }

    // Novo usuário: criar em cdt_users com id do auth (evita conflito de email)
    const name = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || user.email?.split('@')[0] || 'Usuário';
    const { error: insertError } = await supabase.from('cdt_users').insert({
      id: user.id,
      email: user.email ?? '',
      name,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      is_active: true,
    });
    if (insertError) {
      console.warn('[auth] Falha ao criar cdt_users para', user.id, insertError.message);
      next();
      return;
    }
    (req as Request & { userId?: string }).userId = user.id;
    req.headers['x-user-id'] = user.id;
  } catch {
    // Ignora erro (token inválido, etc.) e segue sem usuário
  }
  next();
}
