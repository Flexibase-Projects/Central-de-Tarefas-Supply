import { useAuth } from '@/contexts/AuthContext';

export function usePermissions() {
  const { hasPermission, hasRole, userPermissions, userRole } = useAuth();

  return {
    hasPermission,
    hasRole,
    userPermissions,
    userRole,
  };
}
