import { supabase } from '../config/supabase.js';
import { Role, Permission } from '../types/index.js';
import { getNativeAdminEmails, isNativeAdminUserId } from './native-admin.js';

/**
 * Verifica se um usuário tem uma permissão específica
 */
export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  try {
    // Buscar o cargo do usuário
    const { data: userRole, error: userRoleError } = await supabase
      .from('cdt_user_roles')
      .select('role_id')
      .eq('user_id', userId)
      .single();

    if (userRoleError || !userRole) {
      return false;
    }

    // Buscar a permissão
    const { data: permission, error: permissionError } = await supabase
      .from('cdt_permissions')
      .select('id')
      .eq('name', permissionName)
      .single();

    if (permissionError || !permission) {
      return false;
    }

    // Verificar se o cargo tem a permissão
    const { data: rolePermission, error: rolePermissionError } = await supabase
      .from('cdt_role_permissions')
      .select('id')
      .eq('role_id', userRole.role_id)
      .eq('permission_id', permission.id)
      .single();

    return !rolePermissionError && !!rolePermission;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Obtém todos os cargos de um usuário
 */
export async function getUserRoles(userId: string): Promise<Role[]> {
  try {
    const { data, error } = await supabase
      .from('cdt_user_roles')
      .select(`
        role_id,
        cdt_roles (
          id,
          name,
          display_name,
          description,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }

    return (data || []).map((item: any) => item.cdt_roles).filter(Boolean);
  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
}

/**
 * Obtém todas as permissões de um usuário (através dos seus cargos)
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  try {
    // Buscar o cargo do usuário
    const { data: userRole, error: userRoleError } = await supabase
      .from('cdt_user_roles')
      .select('role_id')
      .eq('user_id', userId)
      .single();

    if (userRoleError || !userRole) {
      return [];
    }

    // Buscar todas as permissões do cargo
    const { data, error } = await supabase
      .from('cdt_role_permissions')
      .select(`
        permission_id,
        cdt_permissions (
          id,
          name,
          display_name,
          description,
          category,
          created_at
        )
      `)
      .eq('role_id', userRole.role_id);

    if (error) {
      console.error('Error fetching user permissions:', error);
      return [];
    }

    return (data || []).map((item: any) => item.cdt_permissions).filter(Boolean);
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

/**
 * Verifica se um usuário tem um cargo específico
 */
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  try {
    if (roleName === 'admin') {
      const nativeAdmin = await isNativeAdminUserId(userId);
      if (nativeAdmin) return true;
    }

    const { data, error } = await supabase
      .from('cdt_user_roles')
      .select(`
        role_id,
        cdt_roles!inner (
          name
        )
      `)
      .eq('user_id', userId)
      .eq('cdt_roles.name', roleName)
      .single();

    return !error && !!data;
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
}

/**
 * Lista todos os IDs de usuários que devem receber eventos administrativos.
 */
export async function getAdminUserIds(): Promise<string[]> {
  try {
    const roleAdminsPromise = supabase
      .from('cdt_user_roles')
      .select(`
        user_id,
        cdt_roles!inner (
          name
        )
      `)
      .eq('cdt_roles.name', 'admin');

    const nativeEmails = getNativeAdminEmails();
    const nativeAdminsPromise = nativeEmails.length > 0
      ? supabase
          .from('cdt_users')
          .select('id, email')
          .in('email', nativeEmails)
      : Promise.resolve({ data: [], error: null } as const);

    const [roleAdminsRes, nativeAdminsRes] = await Promise.all([roleAdminsPromise, nativeAdminsPromise]);

    const adminIds = new Set<string>();

    if (!roleAdminsRes.error && roleAdminsRes.data) {
      for (const row of roleAdminsRes.data as Array<{ user_id?: string | null }>) {
        if (row.user_id) adminIds.add(row.user_id);
      }
    }

    if (!nativeAdminsRes.error && nativeAdminsRes.data) {
      for (const row of nativeAdminsRes.data as Array<{ id?: string | null }>) {
        if (row.id) adminIds.add(row.id);
      }
    }

    return Array.from(adminIds);
  } catch (error) {
    console.error('Error listing admin user ids:', error);
    return [];
  }
}
