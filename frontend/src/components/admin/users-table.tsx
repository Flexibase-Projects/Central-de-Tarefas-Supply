import { useState } from 'react';
import { UserWithRole } from '@/types';
import { useUsers } from '@/hooks/use-users';
import { useRoles } from '@/hooks/use-roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';

export function UsersTable() {
  const { users, loading, createUser, updateUser, deleteUser, assignRole } = useUsers();
  const { roles } = useRoles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [formData, setFormData] = useState({ email: '', name: '', avatar_url: '' });

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({ email: '', name: '', avatar_url: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (user: UserWithRole) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
      } else {
        await createUser(formData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja desativar este usuário?')) {
      await deleteUser(id);
    }
  };

  const handleRoleChange = async (userId: string, roleId: string) => {
    await assignRole(userId, roleId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Usuários</h2>
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-4 text-left text-sm font-semibold text-foreground">Nome</th>
                <th className="p-4 text-left text-sm font-semibold text-foreground">Email</th>
                <th className="p-4 text-left text-sm font-semibold text-foreground">Cargo</th>
                <th className="p-4 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="p-4 text-right text-sm font-semibold text-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm text-foreground font-medium">{user.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="p-4">
                      <select
                        value={user.role?.id || ''}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="">Sem cargo</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.display_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(user)} className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar_url" className="text-foreground">Avatar URL (opcional)</Label>
              <Input
                id="avatar_url"
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                placeholder="https://exemplo.com/avatar.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
