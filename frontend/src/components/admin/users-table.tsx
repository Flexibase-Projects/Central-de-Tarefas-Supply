import { useState } from 'react'
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Typography,
  CircularProgress,
  Chip,
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import { UserWithRole } from '@/types'
import { useUsers } from '@/hooks/use-users'
import { useRoles } from '@/hooks/use-roles'

export function UsersTable() {
  const { users, loading, createUser, updateUser, deleteUser, assignRole } = useUsers()
  const { roles } = useRoles()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null)
  const [formData, setFormData] = useState({ email: '', name: '', avatar_url: '' })

  const handleCreate = () => {
    setEditingUser(null)
    setFormData({ email: '', name: '', avatar_url: '' })
    setIsDialogOpen(true)
  }

  const handleEdit = (user: UserWithRole) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url || '',
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData)
      } else {
        await createUser(formData)
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving user:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja desativar este usuário?')) {
      await deleteUser(id)
    }
  }

  const handleRoleChange = async (userId: string, roleId: string) => {
    await assignRole(userId, roleId)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={600}>Usuários</Typography>
        <Button variant="contained" size="small" onClick={handleCreate} startIcon={<Add />}>
          Novo Usuário
        </Button>
      </Box>

      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 600 }}>Nome</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Cargo</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Nenhum usuário encontrado</Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{user.name}</TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{user.email}</Typography></TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <Select
                        value={user.role?.id || ''}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="">Sem cargo</MenuItem>
                        {roles.map((role) => (
                          <MenuItem key={role.id} value={role.id}>{role.display_name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_active ? 'Ativo' : 'Inativo'}
                      size="small"
                      color={user.is_active ? 'success' : 'error'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(user)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(user.id)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="usuario@exemplo.com"
              fullWidth
            />
            <TextField
              label="Nome"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome completo"
              fullWidth
            />
            <TextField
              label="Avatar URL (opcional)"
              value={formData.avatar_url}
              onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              placeholder="https://exemplo.com/avatar.jpg"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
