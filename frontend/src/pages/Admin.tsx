import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UsersTable } from '@/components/admin/users-table';
import { RolesTable } from '@/components/admin/roles-table';
import { PermissionsList } from '@/components/admin/permissions-list';
import { Button } from '@/components/ui/button';
import { Users, Shield, Key } from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>('users');

  return (
    <ProtectedRoute role="admin">
      <div className="h-full overflow-auto p-6 space-y-6">
        <div className="flex gap-2 border-b border-border pb-2">
          <Button
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('users')}
            className="rounded-b-none"
          >
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </Button>
          <Button
            variant={activeTab === 'roles' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('roles')}
            className="rounded-b-none"
          >
            <Shield className="h-4 w-4 mr-2" />
            Cargos
          </Button>
          <Button
            variant={activeTab === 'permissions' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('permissions')}
            className="rounded-b-none"
          >
            <Key className="h-4 w-4 mr-2" />
            Permissões
          </Button>
        </div>

        <div className="space-y-4">
          {activeTab === 'users' && <UsersTable />}
          {activeTab === 'roles' && <RolesTable />}
          {activeTab === 'permissions' && <PermissionsList />}
        </div>
      </div>
    </ProtectedRoute>
  );
}
