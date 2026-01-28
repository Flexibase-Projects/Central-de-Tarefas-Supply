import { useState, useEffect } from 'react';
import { Permission, Role } from '@/types';
import { Button } from '@/components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || '';

interface RolePermissionsEditorProps {
  role: Role;
  onSave: () => void;
}

export function RolePermissionsEditor({ role, onSave }: RolePermissionsEditorProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar todas as permissões
        const permsResponse = await fetch(`${API_URL}/api/permissions`);
        if (permsResponse.ok) {
          const permsData = await permsResponse.json();
          setPermissions(permsData);
        }

        // Buscar permissões do cargo
        const roleResponse = await fetch(`${API_URL}/api/roles/${role.id}`);
        if (roleResponse.ok) {
          const roleData = await roleResponse.json();
          setSelectedPermissions((roleData.permissions || []).map((p: Permission) => p.id));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role.id]);

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSave = async () => {
    try {
      const userId = localStorage.getItem('cdt_user_id') || '';
      const response = await fetch(`${API_URL}/api/roles/${role.id}/permissions?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ permission_ids: selectedPermissions }),
      });

      if (response.ok) {
        onSave();
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
    }
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    const category = perm.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Permissões de {role.display_name}</h3>
        <Button onClick={handleSave} size="sm">Salvar Permissões</Button>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {Object.entries(groupedPermissions).map(([category, perms]) => (
          <div key={category} className="rounded-lg border border-border bg-card shadow-sm p-4">
            <h4 className="font-semibold mb-3 capitalize text-sm text-foreground">{category}</h4>
            <div className="space-y-2">
              {perms.map((perm) => (
                <label
                  key={perm.id}
                  className="flex items-start gap-3 p-3 rounded-md border border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm.id)}
                    onChange={() => handleTogglePermission(perm.id)}
                    className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-foreground">{perm.display_name}</div>
                    {perm.description && (
                      <div className="text-sm text-muted-foreground mt-1">{perm.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
