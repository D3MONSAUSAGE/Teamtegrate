import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface SimpleRequestType {
  id: string;
  name: string;
  description?: string;
  requires_approval: boolean;
  approval_roles: string[];
  is_active: boolean;
}

interface SimpleRequestCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: SimpleRequestType | null;
  onSuccess?: () => void;
}

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  requires_approval: z.boolean(),
  approval_roles: z.array(z.string()).min(0),
  is_active: z.boolean(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

const AVAILABLE_ROLES = [
  { id: 'manager', label: 'Manager' },
  { id: 'admin', label: 'Admin' },
  { id: 'superadmin', label: 'Super Admin' },
];

export default function SimpleRequestCategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess
}: SimpleRequestCategoryDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      requires_approval: category?.requires_approval || false,
      approval_roles: category?.approval_roles || ['manager'],
      is_active: category?.is_active ?? true,
    },
  });

  // Reset form when category changes
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: category?.name || '',
        description: category?.description || '',
        requires_approval: category?.requires_approval || false,
        approval_roles: category?.approval_roles || ['manager'],
        is_active: category?.is_active ?? true,
      });
    }
  }, [category, open, form]);

  const onSubmit = async (data: CategoryFormData) => {
    if (!user?.organizationId) {
      toast.error('No organization found');
      return;
    }

    setLoading(true);
    try {
      const categoryData = {
        organization_id: user.organizationId,
        name: data.name,
        description: data.description || null,
        category: 'custom', // Simple category for all custom types
        requires_approval: data.requires_approval,
        approval_roles: data.approval_roles,
        is_active: data.is_active,
        form_schema: [], // Empty form schema for simplified approach
        created_by: user.id,
      };

      if (category?.id) {
        // Update existing
        const { error } = await supabase
          .from('request_types')
          .update(categoryData)
          .eq('id', category.id);

        if (error) throw error;
        toast.success('Category updated successfully');
      } else {
        // Create new
        const { error } = await supabase
          .from('request_types')
          .insert(categoryData);

        if (error) throw error;
        toast.success('Category created successfully');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    const currentRoles = form.getValues('approval_roles');
    if (checked) {
      form.setValue('approval_roles', [...currentRoles, roleId]);
    } else {
      form.setValue('approval_roles', currentRoles.filter(r => r !== roleId));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Edit Request Category' : 'Create Request Category'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Time Off Request, Equipment Request"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description to help users understand when to use this category"
                rows={3}
                {...form.register('description')}
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={form.watch('is_active')}
              onCheckedChange={(checked) => form.setValue('is_active', checked)}
            />
            <Label htmlFor="is_active">Active (users can submit this type of request)</Label>
          </div>

          {/* Approval Settings */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="requires_approval"
                  checked={form.watch('requires_approval')}
                  onCheckedChange={(checked) => form.setValue('requires_approval', checked)}
                />
                <Label htmlFor="requires_approval">Requires approval before completion</Label>
              </div>

              {form.watch('requires_approval') && (
                <div className="space-y-3 border-l-2 border-muted pl-4">
                  <Label className="text-sm font-medium">Who can approve these requests?</Label>
                  <div className="space-y-2">
                    {AVAILABLE_ROLES.map((role) => (
                      <div key={role.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={role.id}
                          checked={form.watch('approval_roles').includes(role.id)}
                          onCheckedChange={(checked) => handleRoleToggle(role.id, checked as boolean)}
                        />
                        <Label htmlFor={role.id} className="text-sm">
                          {role.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {form.watch('approval_roles').length === 0 && (
                    <p className="text-sm text-orange-600">
                      Warning: No approval roles selected. Requests may not be approvable.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  {category ? 'Update Category' : 'Create Category'}
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}