import { useState, useEffect, useCallback } from 'react';
import { Role, Permission } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface RoleWithPermissions extends Role {
  permissions?: Permission[];
}

export function useRoles() {
  const { currentUser } = useAuth();
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = currentUser?.id || '';
      const response = await fetch(`${API_URL}/api/roles?userId=${userId}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }

      const data = await response.json();
      setRoles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch roles');
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const createRole = async (roleData: { name: string; display_name: string; description?: string }) => {
    try {
      const userId = currentUser?.id || '';
      const response = await fetch(`${API_URL}/api/roles?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify(roleData),
      });

      if (!response.ok) {
        throw new Error('Failed to create role');
      }

      const newRole = await response.json();
      await fetchRoles();
      return newRole;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create role');
    }
  };

  const updateRole = async (id: string, roleData: Partial<Role>) => {
    try {
      const userId = currentUser?.id || '';
      const response = await fetch(`${API_URL}/api/roles/${id}?userId=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify(roleData),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      const updatedRole = await response.json();
      await fetchRoles();
      return updatedRole;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update role');
    }
  };

  const deleteRole = async (id: string) => {
    try {
      const userId = currentUser?.id || '';
      const response = await fetch(`${API_URL}/api/roles/${id}?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete role');
      }

      await fetchRoles();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete role');
    }
  };

  const assignPermissions = async (roleId: string, permissionIds: string[]) => {
    try {
      const userId = currentUser?.id || '';
      const response = await fetch(`${API_URL}/api/roles/${roleId}/permissions?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ permission_ids: permissionIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign permissions');
      }

      await fetchRoles();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to assign permissions');
    }
  };

  return {
    roles,
    loading,
    error,
    createRole,
    updateRole,
    deleteRole,
    assignPermissions,
    refreshRoles: fetchRoles,
  };
}
