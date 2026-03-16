import express from 'express';
import { supabase } from '../config/supabase.js';
import { User } from '../types/index.js';
import { checkRole } from '../middleware/permissions.js';
import { hasRole } from '../services/permissions.js';
import { isNativeAdminUserId } from '../services/native-admin.js';
import {
  isSupabaseConnectionRefused,
  SUPABASE_UNAVAILABLE_MESSAGE,
} from '../utils/supabase-errors.js';

const router = express.Router();

type AuthRequest = express.Request & {
  userId?: string;
  authUserId?: string;
  authUserEmail?: string;
};

function getRequesterId(req: express.Request): string | null {
  return (
    ((req as AuthRequest).userId ?? null) ||
    (req.headers['x-user-id'] as string | undefined) ||
    null
  );
}

function getAuthUserId(req: express.Request): string | null {
  return ((req as AuthRequest).authUserId ?? null) || null;
}

async function ensureAdmin(
  req: express.Request,
  res: express.Response,
): Promise<string | null> {
  const requesterId = getRequesterId(req);
  if (!requesterId) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  const isAdmin = await hasRole(requesterId, 'admin');
  if (!isAdmin) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }

  return requesterId;
}

async function getUserRole(userId: string) {
  const { data } = await supabase
    .from('cdt_user_roles')
    .select(
      `
      role_id,
      cdt_roles (
        id,
        name,
        display_name,
        description
      )
    `,
    )
    .eq('user_id', userId)
    .maybeSingle();

  return data?.cdt_roles ?? null;
}

async function assignRoleToUser(params: {
  userId: string;
  roleId: string;
  assignedBy: string | null;
}): Promise<void> {
  const { data: role, error: roleError } = await supabase
    .from('cdt_roles')
    .select('id, name')
    .eq('id', params.roleId)
    .maybeSingle();

  if (roleError || !role?.id) {
    throw new Error('Cargo informado nao existe.');
  }

  const nativeAdmin = await isNativeAdminUserId(params.userId);
  if (nativeAdmin && role.name !== 'admin') {
    throw new Error('Usuario admin nativo deve permanecer com cargo admin.');
  }

  await supabase.from('cdt_user_roles').delete().eq('user_id', params.userId);

  const { error: insertError } = await supabase.from('cdt_user_roles').insert({
    user_id: params.userId,
    role_id: params.roleId,
    assigned_by: params.assignedBy,
  });

  if (insertError) throw insertError;
}

// List users from Supabase Auth (admin only) to approve access.
router.get('/auth-list', checkRole('admin'), async (_req, res) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });

    if (authError) {
      return res.status(500).json({ error: authError.message || 'Failed to list auth users' });
    }

    const authUsers = authData?.users || [];
    const cdtIds = new Set<string>();

    if (authUsers.length > 0) {
      const { data: cdtRows } = await supabase
        .from('cdt_users')
        .select('id')
        .in(
          'id',
          authUsers.map((user) => user.id),
        );
      (cdtRows || []).forEach((row: { id: string }) => cdtIds.add(row.id));
    }

    const list = authUsers.map((user) => ({
      id: user.id,
      email: user.email ?? '',
      name:
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        user.email?.split('@')[0] ||
        '-',
      created_at: user.created_at,
      in_cdt: cdtIds.has(user.id),
    }));

    res.json(list);
  } catch (error: unknown) {
    if (isSupabaseConnectionRefused(error)) {
      return res.status(503).json({ error: SUPABASE_UNAVAILABLE_MESSAGE });
    }
    console.error('Error fetching auth users:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch auth users',
    });
  }
});

// Grant access from an existing Supabase Auth user, with optional role assignment.
router.post('/from-auth', checkRole('admin'), async (req, res) => {
  try {
    const requesterId = getRequesterId(req);
    const { id, email, name, role_id } = req.body as {
      id?: string;
      email?: string;
      name?: string;
      role_id?: string | null;
    };

    if (!id || !email) {
      return res.status(400).json({ error: 'id and email are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const displayName = (name && String(name).trim()) || normalizedEmail.split('@')[0] || 'Usuario';
    let targetUserId = id;

    const byId = await supabase.from('cdt_users').select('id').eq('id', id).maybeSingle();
    if (!byId.error && byId.data?.id) {
      targetUserId = byId.data.id;
      await supabase
        .from('cdt_users')
        .update({
          email: normalizedEmail,
          name: displayName,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId);
    } else {
      const byEmail = await supabase
        .from('cdt_users')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (!byEmail.error && byEmail.data?.id) {
        targetUserId = byEmail.data.id;
        await supabase
          .from('cdt_users')
          .update({
            name: displayName,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetUserId);
      } else {
        const { error: insertError } = await supabase.from('cdt_users').insert({
          id,
          email: normalizedEmail,
          name: displayName,
          avatar_url: null,
          is_active: true,
        });
        if (insertError) throw insertError;
      }
    }

    if (role_id) {
      await assignRoleToUser({
        userId: targetUserId,
        roleId: role_id,
        assignedBy: requesterId,
      });
    }

    const { data: userRow, error: userError } = await supabase
      .from('cdt_users')
      .select('*')
      .eq('id', targetUserId)
      .single();
    if (userError || !userRow) {
      throw userError ?? new Error('Failed to load granted user');
    }

    const role = await getUserRole(targetUserId);
    res.status(201).json({ ...userRow, role });
  } catch (error: unknown) {
    if (error instanceof Error && /admin nativo/i.test(error.message)) {
      return res.status(400).json({ error: error.message });
    }
    if (isSupabaseConnectionRefused(error)) {
      return res.status(503).json({ error: SUPABASE_UNAVAILABLE_MESSAGE });
    }
    console.error('Error granting access from auth:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to grant user access',
    });
  }
});

// Get users.
// - for_assignment=true: any approved/authenticated user can list active users.
// - otherwise: admin only.
router.get('/', async (req, res) => {
  try {
    const requesterId = getRequesterId(req);
    const isForAssignment = String(req.query.for_assignment ?? '').toLowerCase() === 'true';

    if (!requesterId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (isForAssignment) {
      const { data: users, error } = await supabase
        .from('cdt_users')
        .select('id, name, email, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (error) throw error;
      return res.json(users || []);
    }

    const isAdmin = await hasRole(requesterId, 'admin');
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data: users, error: usersError } = await supabase
      .from('cdt_users')
      .select('*')
      .order('created_at', { ascending: false });
    if (usersError) throw usersError;

    const usersWithRoles = await Promise.all(
      (users || []).map(async (user: User) => ({
        ...user,
        role: await getUserRole(user.id),
      })),
    );

    res.json(usersWithRoles);
  } catch (error: unknown) {
    if (isSupabaseConnectionRefused(error)) {
      return res.status(503).json({ error: SUPABASE_UNAVAILABLE_MESSAGE });
    }
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch users',
    });
  }
});

// Current authenticated user profile.
router.get('/me', async (req, res) => {
  try {
    const requesterId = getRequesterId(req);
    const authUserId = getAuthUserId(req);

    if (!authUserId && !requesterId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!requesterId) {
      return res.status(403).json({
        error: 'Acesso pendente de liberacao pelo administrador.',
        code: 'ACCESS_PENDING',
      });
    }

    const { data: user, error: userError } = await supabase
      .from('cdt_users')
      .select('*')
      .eq('id', requesterId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const role = await getUserRole(requesterId);
    res.json({ ...user, role });
  } catch (error: unknown) {
    if (isSupabaseConnectionRefused(error)) {
      return res.status(503).json({ error: SUPABASE_UNAVAILABLE_MESSAGE });
    }
    console.error('Error fetching current user:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch user',
    });
  }
});

// Get user by id (admin only).
router.get('/:id', checkRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { data: user, error: userError } = await supabase
      .from('cdt_users')
      .select('*')
      .eq('id', id)
      .single();

    if (userError) throw userError;
    if (!user) return res.status(404).json({ error: 'User not found' });

    const role = await getUserRole(id);
    res.json({ ...user, role });
  } catch (error: unknown) {
    if (isSupabaseConnectionRefused(error)) {
      return res.status(503).json({ error: SUPABASE_UNAVAILABLE_MESSAGE });
    }
    console.error('Error fetching user:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch user',
    });
  }
});

// Create user manually (admin only).
router.post('/', checkRole('admin'), async (req, res) => {
  try {
    const { email, name, avatar_url } = req.body as {
      email?: string;
      name?: string;
      avatar_url?: string | null;
    };

    if (!email || !name) {
      return res.status(400).json({ error: 'email and name are required' });
    }

    const { data, error } = await supabase
      .from('cdt_users')
      .insert({
        email: String(email).trim().toLowerCase(),
        name: String(name).trim(),
        avatar_url: avatar_url || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: unknown) {
    if (isSupabaseConnectionRefused(error)) {
      return res.status(503).json({ error: SUPABASE_UNAVAILABLE_MESSAGE });
    }
    console.error('Error creating user:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create user',
    });
  }
});

// Update user (admin only).
router.put('/:id', checkRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, avatar_url, is_active } = req.body as {
      email?: string;
      name?: string;
      avatar_url?: string | null;
      is_active?: boolean;
    };

    const nativeAdmin = await isNativeAdminUserId(id);
    if (nativeAdmin && is_active === false) {
      return res.status(400).json({ error: 'Admin nativo nao pode ser desativado.' });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (email !== undefined) updateData.email = String(email).trim().toLowerCase();
    if (name !== undefined) updateData.name = String(name).trim();
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('cdt_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'User not found' });

    res.json(data);
  } catch (error: unknown) {
    if (isSupabaseConnectionRefused(error)) {
      return res.status(503).json({ error: SUPABASE_UNAVAILABLE_MESSAGE });
    }
    console.error('Error updating user:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update user',
    });
  }
});

// Soft delete user (admin only).
router.delete('/:id', checkRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const nativeAdmin = await isNativeAdminUserId(id);
    if (nativeAdmin) {
      return res.status(400).json({ error: 'Admin nativo nao pode ser desativado.' });
    }

    const { data, error } = await supabase
      .from('cdt_users')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'User not found' });
    res.json(data);
  } catch (error: unknown) {
    if (isSupabaseConnectionRefused(error)) {
      return res.status(503).json({ error: SUPABASE_UNAVAILABLE_MESSAGE });
    }
    console.error('Error deleting user:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to delete user',
    });
  }
});

// Assign role (admin only).
router.post('/:id/role', checkRole('admin'), async (req, res) => {
  try {
    const requesterId = getRequesterId(req);
    const { id } = req.params;
    const { role_id } = req.body as { role_id?: string };

    if (!role_id) {
      return res.status(400).json({ error: 'role_id is required' });
    }

    await assignRoleToUser({
      userId: id,
      roleId: role_id,
      assignedBy: requesterId,
    });

    res.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && /admin nativo/i.test(error.message)) {
      return res.status(400).json({ error: error.message });
    }
    if (isSupabaseConnectionRefused(error)) {
      return res.status(503).json({ error: SUPABASE_UNAVAILABLE_MESSAGE });
    }
    console.error('Error assigning role:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to assign role',
    });
  }
});

// Remove role (admin only).
router.delete('/:id/role', checkRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const nativeAdmin = await isNativeAdminUserId(id);
    if (nativeAdmin) {
      return res.status(400).json({ error: 'Admin nativo nao pode ficar sem cargo.' });
    }

    const { error } = await supabase.from('cdt_user_roles').delete().eq('user_id', id);
    if (error) throw error;
    res.status(204).send();
  } catch (error: unknown) {
    if (isSupabaseConnectionRefused(error)) {
      return res.status(503).json({ error: SUPABASE_UNAVAILABLE_MESSAGE });
    }
    console.error('Error removing role:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to remove role',
    });
  }
});

export default router;
