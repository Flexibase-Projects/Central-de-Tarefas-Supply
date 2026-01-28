import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/use-permissions';

interface RequirePermissionProps {
  children: ReactNode;
  permission?: string;
  role?: string;
  fallback?: ReactNode;
}

export function RequirePermission({ 
  children, 
  permission, 
  role, 
  fallback = null 
}: RequirePermissionProps) {
  const { hasPermission, hasRole } = usePermissions();

  // Se não há permissão ou role especificada, mostrar conteúdo
  if (!permission && !role) {
    return <>{children}</>;
  }

  // Verificar permissão se especificada
  if (permission && !hasPermission(permission)) {
    return fallback ? <>{fallback}</> : null;
  }

  // Verificar role se especificada
  if (role && !hasRole(role)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
