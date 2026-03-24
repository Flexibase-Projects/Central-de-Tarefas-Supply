import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { ensureNativeAdminAccess } from '../services/native-admin.js';
import { hasRole } from '../services/permissions.js';

type AuthRequest = Request & {
  userId?: string;
  effectiveUserId?: string;
  realUserId?: string;
  authUserId?: string;
  authUserEmail?: string;
};

export function getEffectiveUserId(req: Request): string | null {
  const authReq = req as AuthRequest;
  return (
    authReq.effectiveUserId ??
    authReq.userId ??
    (typeof req.headers['x-user-id'] === 'string' ? req.headers['x-user-id'] : null) ??
    null
  );
}

export function getRealUserId(req: Request): string | null {
  const authReq = req as AuthRequest;
  return authReq.realUserId ?? authReq.userId ?? null;
}

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
    const requestedUserIdHeader =
      typeof req.headers['x-user-id'] === 'string'
        ? req.headers['x-user-id']
        : Array.isArray(req.headers['x-user-id'])
          ? req.headers['x-user-id'][0]
          : null;

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
    authReq.realUserId = undefined;
    authReq.effectiveUserId = undefined;

    let realUserId: string | null = null;
    // Access already granted by id.
    const byId = await supabase.from('cdt_users').select('id').eq('id', user.id).maybeSingle();
    if (!byId.error && byId.data?.id) {
      realUserId = byId.data.id;
    }

    // Access already granted by email (legacy user rows).
    if (!realUserId && user.email) {
      const byEmail = await supabase
        .from('cdt_users')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();
      if (!byEmail.error && byEmail.data?.id) {
        realUserId = byEmail.data.id;
      }
    }

    // Automatic access only for native admin emails.
    if (!realUserId) {
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
        realUserId = nativeAdminUserId;
      }
    }

    if (realUserId) {
      let effectiveUserId = realUserId;

      if (requestedUserIdHeader && requestedUserIdHeader !== realUserId) {
        const realUserIsAdmin = await hasRole(realUserId, 'admin');
        if (realUserIsAdmin) {
          const target = await supabase
            .from('cdt_users')
            .select('id, is_active')
            .eq('id', requestedUserIdHeader)
            .maybeSingle();
          if (!target.error && target.data?.id && target.data.is_active !== false) {
            effectiveUserId = target.data.id;
          }
        }
      }

      authReq.realUserId = realUserId;
      authReq.userId = effectiveUserId;
      authReq.effectiveUserId = effectiveUserId;
      req.headers['x-user-id'] = effectiveUserId;
    }
  } catch {
    // Ignore auth errors and continue as unauthenticated for app-level handling.
  }

  next();
}
