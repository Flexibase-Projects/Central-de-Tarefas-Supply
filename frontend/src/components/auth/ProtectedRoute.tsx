import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/use-permissions';

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: string;
  role?: string;
  fallback?: ReactNode;
}

export function ProtectedRoute({ 
  children, 
  permission, 
  role, 
  fallback 
}: ProtectedRouteProps) {
  const { hasPermission, hasRole } = usePermissions();

  // Se não há permissão ou role especificada, permitir acesso
  if (!permission && !role) {
    return <>{children}</>;
  }

  // Verificar permissão se especificada
  if (permission && !hasPermission(permission)) {
    return fallback ? <>{fallback}</> : <Navigate to="/" replace />;
  }

  // Verificar role se especificada
  if (role && !hasRole(role)) {
    return fallback ? <>{fallback}</> : <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
