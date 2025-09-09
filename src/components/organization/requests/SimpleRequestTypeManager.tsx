import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';
import SimpleRequestCategoryDialog from './SimpleRequestCategoryDialog';

interface SimpleRequestType {
  id: string;
  name: string;
  description?: string;
  requires_approval: boolean;
  approval_roles: string[];
  is_active: boolean;
  created_at: string;
}

export default function SimpleRequestTypeManager() {
  const { user } = useAuth();
  const [requestTypes, setRequestTypes] = useState<SimpleRequestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<SimpleRequestType | null>(null);

  const canManage = hasRoleAccess(user?.role, 'manager');

  useEffect(() => {
    fetchRequestTypes();
  }, [user?.organizationId]);

  const fetchRequestTypes = async () => {
    if (!user?.organizationId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('request_types')
        .select('id, name, description, requires_approval, approval_roles, is_active, created_at')
        .eq('organization_id', user.organizationId)
        .order('name');

      if (error) throw error;
      setRequestTypes(data || []);
    } catch (error) {
      console.error('Error fetching request types:', error);
      toast.error('Failed to load request types');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingType(null);
    setDialogOpen(true);
  };

  const handleEdit = (type: SimpleRequestType) => {
    setEditingType(type);
    setDialogOpen(true);
  };

  const handleToggleActive = async (type: SimpleRequestType) => {
    if (!canManage) {
      toast.error('You do not have permission to modify request types');
      return;
    }

    try {
      const { error } = await supabase
        .from('request_types')
        .update({ is_active: !type.is_active })
        .eq('id', type.id);

      if (error) throw error;

      toast.success(`Request type ${type.is_active ? 'deactivated' : 'activated'}`);
      fetchRequestTypes();
    } catch (error) {
      console.error('Error toggling request type:', error);
      toast.error('Failed to update request type');
    }
  };

  const handleDelete = async (type: SimpleRequestType) => {
    if (!canManage) {
      toast.error('You do not have permission to delete request types');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${type.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('request_types')
        .delete()
        .eq('id', type.id);

      if (error) throw error;

      toast.success('Request type deleted successfully');
      fetchRequestTypes();
    } catch (error) {
      console.error('Error deleting request type:', error);
      toast.error('Failed to delete request type');
    }
  };

  const filteredTypes = requestTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeTypes = filteredTypes.filter(type => type.is_active);
  const inactiveTypes = filteredTypes.filter(type => !type.is_active);

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading request types...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Request Categories</h2>
          <p className="text-sm text-muted-foreground">
            Manage the types of requests users can submit
          </p>
        </div>
        <Button onClick={handleCreate} disabled={!canManage}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {!canManage && (
        <Alert>
          <AlertDescription>
            You have view-only access. Contact an administrator to manage request types.
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{requestTypes.length}</div>
            <p className="text-sm text-muted-foreground">Total Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{activeTypes.length}</div>
            <p className="text-sm text-muted-foreground">Active Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {requestTypes.filter(t => t.requires_approval).length}
            </div>
            <p className="text-sm text-muted-foreground">Require Approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Categories */}
      {activeTypes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Active Categories</h3>
          <div className="grid gap-4">
            {activeTypes.map((type) => (
              <Card key={type.id} className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{type.name}</h4>
                        <Badge variant="default">Active</Badge>
                        {type.requires_approval && (
                          <Badge variant="secondary">Requires Approval</Badge>
                        )}
                      </div>
                      {type.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {type.description}
                        </p>
                      )}
                      {type.requires_approval && (
                        <p className="text-xs text-muted-foreground">
                          Approved by: {type.approval_roles.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(type)}
                        disabled={!canManage}
                      >
                        <ToggleRight className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(type)}
                        disabled={!canManage}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(type)}
                        disabled={!canManage}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Inactive Categories */}
      {inactiveTypes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Inactive Categories</h3>
          <div className="grid gap-4">
            {inactiveTypes.map((type) => (
              <Card key={type.id} className="border-l-4 border-l-gray-300 opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-muted-foreground">{type.name}</h4>
                        <Badge variant="secondary">Inactive</Badge>
                        {type.requires_approval && (
                          <Badge variant="outline">Requires Approval</Badge>
                        )}
                      </div>
                      {type.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {type.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(type)}
                        disabled={!canManage}
                      >
                        <ToggleLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(type)}
                        disabled={!canManage}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(type)}
                        disabled={!canManage}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {filteredTypes.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? 'No categories match your search.' : 'No request categories configured yet.'}
            </p>
            {!searchTerm && canManage && (
              <Button className="mt-4" onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Category
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <SimpleRequestCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingType}
        onSuccess={() => {
          setDialogOpen(false);
          fetchRequestTypes();
        }}
      />
    </div>
  );
}