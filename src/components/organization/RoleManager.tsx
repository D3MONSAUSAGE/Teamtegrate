import React, { useState } from 'react';
import { useJobRoles } from '@/hooks/useJobRoles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, MoreHorizontal, Edit, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { JobRole } from '@/types';
import { toast } from 'sonner';

export const RoleManager: React.FC = () => {
  const {
    jobRoles,
    isLoading,
    canManageJobRoles,
    createJobRole,
    updateJobRole,
    toggleJobRoleStatus,
    deleteJobRole,
    isCreating,
    isUpdating,
    isDeleting
  } = useJobRoles();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<JobRole | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleCreateRole = () => {
    if (!formData.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    
    createJobRole({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined
    });
    
    setFormData({ name: '', description: '' });
    setIsCreateDialogOpen(false);
  };

  const handleEditRole = () => {
    if (!editingRole || !formData.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    
    updateJobRole({
      id: editingRole.id,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined
    });
    
    setIsEditDialogOpen(false);
    setEditingRole(null);
    setFormData({ name: '', description: '' });
  };

  const openEditDialog = (role: JobRole) => {
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description || '' });
    setIsEditDialogOpen(true);
  };

  const handleToggleStatus = (role: JobRole) => {
    toggleJobRoleStatus({ id: role.id, isActive: !role.is_active });
  };

  const handleDeleteRole = (role: JobRole) => {
    if (confirm(`Are you sure you want to delete the "${role.name}" role? This action cannot be undone.`)) {
      deleteJobRole(role.id);
    }
  };

  if (!canManageJobRoles) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">You don't have permission to manage job roles.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Loading job roles...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Job Roles Management</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Job Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Job Role</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Role Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Senior Developer, Marketing Specialist"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the responsibilities and requirements..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setFormData({ name: '', description: '' });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRole} disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Role'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {jobRoles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No job roles created yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first job role to start organizing your team.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>{role.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={role.is_active ? "default" : "secondary"}>
                        {role.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(role.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(role)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(role)}>
                            {role.is_active ? (
                              <><ToggleLeft className="h-4 w-4 mr-2" />Deactivate</>
                            ) : (
                              <><ToggleRight className="h-4 w-4 mr-2" />Activate</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteRole(role)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Job Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Role Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Senior Developer, Marketing Specialist"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the responsibilities and requirements..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingRole(null);
                  setFormData({ name: '', description: '' });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEditRole} disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Update Role'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};