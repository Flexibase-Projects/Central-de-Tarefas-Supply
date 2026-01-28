import { useState, useEffect } from 'react';
import { Permission } from '@/types';
import { Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export function PermissionsList() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await fetch(`${API_URL}/api/permissions`);
        if (response.ok) {
          const data = await response.json();
          setPermissions(data);
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const groupedPermissions = permissions.reduce((acc, perm) => {
    const category = perm.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Permissões</h2>
      <div className="space-y-4">
        {Object.entries(groupedPermissions).map(([category, perms]) => (
          <div key={category} className="rounded-lg border border-border bg-card shadow-sm p-4">
            <h3 className="text-base font-semibold mb-3 capitalize text-foreground">{category}</h3>
            <div className="space-y-2">
              {perms.map((perm) => (
                <div key={perm.id} className="flex items-start gap-3 p-3 rounded-md border border-border bg-background hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-foreground">{perm.display_name}</div>
                    {perm.description && (
                      <div className="text-sm text-muted-foreground mt-1">{perm.description}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1 font-mono">{perm.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
