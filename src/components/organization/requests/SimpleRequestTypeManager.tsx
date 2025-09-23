import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, ToggleLeft, ToggleRight, ChevronRight, FolderOpen, FileText } from 'lucide-react';
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
  subcategory?: string;
  parent_category_id?: string;
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

  const canManage = hasRoleAccess(user?.role, 'admin');

  useEffect(() => {
    fetchRequestTypes();
  }, [user?.organizationId]);

  const fetchRequestTypes = async () => {
    if (!user?.organizationId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('request_types')
        .select('id, name, description, subcategory, parent_category_id, requires_approval, approval_roles, is_active, created_at')
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

    try {
      // Check for subcategories if this is a parent category
      const { data: subcategoriesData, error: subError } = await supabase
        .from('request_types')
        .select('id, name')
        .eq('parent_category_id', type.id)
        .eq('organization_id', user?.organizationId);

      if (subError) throw subError;

      // Check for existing requests that use this category
      const { data: requestsData, error: requestError } = await supabase
        .from('requests')
        .select('id')
        .eq('request_type_id', type.id)
        .eq('organization_id', user?.organizationId);

      if (requestError) throw requestError;

      const subcategoriesCount = subcategoriesData?.length || 0;
      const existingRequestsCount = requestsData?.length || 0;

      // Build warning message
      let warningMessage = `Are you sure you want to delete "${type.name}"?`;
      
      if (existingRequestsCount > 0) {
        toast.error(`Cannot delete "${type.name}" - it has ${existingRequestsCount} existing request(s). Please deactivate instead of deleting.`);
        return;
      }

      if (subcategoriesCount > 0) {
        warningMessage += `\n\nThis will also delete ${subcategoriesCount} subcategory(ies):`;
        subcategoriesData?.forEach(sub => {
          warningMessage += `\n• ${sub.name}`;
        });
        warningMessage += '\n\nThis action cannot be undone.';
      } else {
        warningMessage += '\n\nThis action cannot be undone.';
      }

      if (!confirm(warningMessage)) {
        return;
      }

      // Delete subcategories first (cascade deletion)
      if (subcategoriesCount > 0) {
        const { error: deleteSubError } = await supabase
          .from('request_types')
          .delete()
          .eq('parent_category_id', type.id);

        if (deleteSubError) throw deleteSubError;
      }

      // Delete the main category
      const { error } = await supabase
        .from('request_types')
        .delete()
        .eq('id', type.id);

      if (error) throw error;

      const successMessage = subcategoriesCount > 0 
        ? `Request type "${type.name}" and ${subcategoriesCount} subcategory(ies) deleted successfully`
        : `Request type "${type.name}" deleted successfully`;
      
      toast.success(successMessage);
      fetchRequestTypes();
    } catch (error) {
      console.error('Error deleting request type:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to delete request type: ${errorMessage}`);
    }
  };

  const filteredTypes = requestTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Organize categories hierarchically
  const mainCategories = filteredTypes.filter(type => !type.parent_category_id);
  const subcategories = filteredTypes.filter(type => type.parent_category_id);

  const activeTypes = filteredTypes.filter(type => type.is_active);
  const inactiveTypes = filteredTypes.filter(type => !type.is_active);

  const renderCategoryCard = (type: SimpleRequestType, isSubcategory = false) => (
    <Card key={type.id} className={`border-l-4 ${type.is_active ? 'border-l-green-500' : 'border-l-gray-300 opacity-75'} ${isSubcategory ? 'ml-6' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isSubcategory ? <FileText className="h-4 w-4" /> : <FolderOpen className="h-4 w-4" />}
              <h4 className={`font-semibold ${!type.is_active ? 'text-muted-foreground' : ''}`}>{type.name}</h4>
              <Badge variant={type.is_active ? "default" : "secondary"}>
                {type.is_active ? 'Active' : 'Inactive'}
              </Badge>
              {type.requires_approval && (
                <Badge variant={type.is_active ? "secondary" : "outline"}>Requires Approval</Badge>
              )}
              {isSubcategory && (
                <Badge variant="outline" className="text-xs">Subcategory</Badge>
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
              {type.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
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
  );

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
            Manage the types of requests users can submit with hierarchical organization
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{requestTypes.length}</div>
            <p className="text-sm text-muted-foreground">Total Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{mainCategories.length}</div>
            <p className="text-sm text-muted-foreground">Main Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{subcategories.length}</div>
            <p className="text-sm text-muted-foreground">Subcategories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{activeTypes.length}</div>
            <p className="text-sm text-muted-foreground">Active Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Hierarchical Category Display */}
      {mainCategories.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Categories & Subcategories</h3>
          <div className="grid gap-4">
            {mainCategories.map((mainCategory) => (
              <div key={mainCategory.id} className="space-y-2">
                {renderCategoryCard(mainCategory)}
                {/* Render subcategories under main category */}
                {subcategories
                  .filter(sub => sub.parent_category_id === mainCategory.id)
                  .map(subCategory => renderCategoryCard(subCategory, true))
                }
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orphaned Subcategories (subcategories without parent) */}
      {subcategories.filter(sub => !mainCategories.find(main => main.id === sub.parent_category_id)).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Orphaned Subcategories</h3>
          <div className="grid gap-4">
            {subcategories
              .filter(sub => !mainCategories.find(main => main.id === sub.parent_category_id))
              .map(subCategory => renderCategoryCard(subCategory, true))
            }
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