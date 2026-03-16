import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { ensureNativeAdminAccess } from '../services/native-admin.js';

type AuthRequest = Request & {
  userId?: string;
  authUserId?: string;
  authUserEmail?: string;
};

/**
 * Resolves authenticated user context from Supabase JWT.
 * - `authUserId` / `authUserEmail`: any valid Supabase Auth user.
 * - `userId` / `x-user-id`: only users with access in `cdt_users`.
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    next();
    return;
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      next();
      return;
    }

    const authReq = req as AuthRequest;
    authReq.authUserId = user.id;
    authReq.authUserEmail = user.email ?? '';

    // Access already granted by id.
    const byId = await supabase.from('cdt_users').select('id').eq('id', user.id).maybeSingle();
    if (!byId.error && byId.data?.id) {
      authReq.userId = byId.data.id;
      req.headers['x-user-id'] = byId.data.id;
      next();
      return;
    }

    // Access already granted by email (legacy user rows).
    if (user.email) {
      const byEmail = await supabase
        .from('cdt_users')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();
      if (!byEmail.error && byEmail.data?.id) {
        authReq.userId = byEmail.data.id;
        req.headers['x-user-id'] = byEmail.data.id;
        next();
        return;
      }
    }

    // Automatic access only for native admin emails.
    const resolvedName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split('@')[0] ||
      'Usuario';

    const nativeAdminUserId = await ensureNativeAdminAccess({
      authUserId: user.id,
      email: user.email,
      name: resolvedName,
      avatarUrl: (user.user_metadata?.avatar_url as string | null) ?? null,
    });

    if (nativeAdminUserId) {
      authReq.userId = nativeAdminUserId;
      req.headers['x-user-id'] = nativeAdminUserId;
    }
  } catch {
    // Ignore auth errors and continue as unauthenticated for app-level handling.
  }

  next();
}
