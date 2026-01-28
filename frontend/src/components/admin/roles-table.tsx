import { useState } from 'react';
import { RoleWithPermissions, useRoles } from '@/hooks/use-roles';
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
import { RolePermissionsEditor } from './role-permissions-editor';
import { Plus, Edit, Trash2, Loader2, Settings } from 'lucide-react';

export function RolesTable() {
  const { roles, loading, createRole, updateRole, deleteRole, refreshRoles } = useRoles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [formData, setFormData] = useState({ name: '', display_name: '', description: '' });

  const handleCreate = () => {
    setEditingRole(null);
    setFormData({ name: '', display_name: '', description: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (role: RoleWithPermissions) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      display_name: role.display_name,
      description: role.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleManagePermissions = (role: RoleWithPermissions) => {
    setSelectedRole(role);
    setIsPermissionsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingRole) {
        await updateRole(editingRole.id, formData);
      } else {
        await createRole(formData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este cargo?')) {
      await deleteRole(id);
    }
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
        <h2 className="text-xl font-semibold text-foreground">Cargos</h2>
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cargo
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-4 text-left text-sm font-semibold text-foreground">Nome</th>
                <th className="p-4 text-left text-sm font-semibold text-foreground">Descrição</th>
                <th className="p-4 text-left text-sm font-semibold text-foreground">Permissões</th>
                <th className="p-4 text-right text-sm font-semibold text-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    Nenhum cargo encontrado
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm text-foreground font-medium">{role.display_name}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {role.description || '-'}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {role.permissions?.length || 0} permissões
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManagePermissions(role)}
                          className="h-8 w-8 p-0"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(role)} className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(role.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
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
            <DialogTitle className="text-foreground">{editingRole ? 'Editar Cargo' : 'Novo Cargo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Nome (código)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!!editingRole}
                placeholder="ex: developer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name" className="text-foreground">Nome de Exibição</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="ex: Desenvolvedor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do cargo"
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

      {selectedRole && (
        <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Gerenciar Permissões - {selectedRole.display_name}</DialogTitle>
            </DialogHeader>
            <RolePermissionsEditor
              role={selectedRole}
              onSave={() => {
                setIsPermissionsDialogOpen(false);
                refreshRoles();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
