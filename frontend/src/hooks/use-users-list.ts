import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Hook simplificado para listar usuários apenas para atribuição
 * Não requer permissão admin
 */
export function useUsersList() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = currentUser?.id || '';
      const response = await fetch(`${API_URL}/api/users?for_assignment=true&userId=${userId}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser, fetchUsers]);

  return {
    users,
    loading,
    error,
    refreshUsers: fetchUsers,
  };
}
