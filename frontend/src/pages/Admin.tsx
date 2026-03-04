import { useState } from 'react'
import { Box, Tabs, Tab } from '@mui/material'
import { People, Security, Key } from '@mui/icons-material'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { UsersTable } from '@/components/admin/users-table'
import { RolesTable } from '@/components/admin/roles-table'
import { PermissionsList } from '@/components/admin/permissions-list'

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>('users')

  return (
    <ProtectedRoute role="admin">
      <Box sx={{ height: '100%', overflow: 'auto', p: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tab value="users" label="Usuários" icon={<People />} iconPosition="start" />
          <Tab value="roles" label="Cargos" icon={<Security />} iconPosition="start" />
          <Tab value="permissions" label="Permissões" icon={<Key />} iconPosition="start" />
        </Tabs>

        <Box sx={{ pt: 2 }}>
          {activeTab === 'users' && <UsersTable />}
          {activeTab === 'roles' && <RolesTable />}
          {activeTab === 'permissions' && <PermissionsList />}
        </Box>
      </Box>
    </ProtectedRoute>
  )
}
