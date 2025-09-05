import React, { useState } from 'react';
import { useJobRoles } from '@/hooks/useJobRoles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  ToggleLeft, 
  ToggleRight, 
  Trash2, 
  Users, 
  BarChart3,
  Briefcase,
  Info,
  Building2,
  UserCheck
} from 'lucide-react';
import { JobRole } from '@/types';
import { toast } from 'sonner';
import { JobRoleAssignmentDashboard } from './job-roles/JobRoleAssignmentDashboard';
import { JobRoleAnalytics } from './job-roles/JobRoleAnalytics';
import { BulkUserAssignment } from './job-roles/BulkUserAssignment';

export const JobRoleManager: React.FC = () => {
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
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">You don't have permission to manage organizational job roles.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Organizational Job Roles
          </h2>
          <p className="text-muted-foreground mt-1">
            Define and manage job positions within your organization structure
          </p>
        </div>
      </div>

      {/* Information Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Job Roles vs System Roles:</strong> Job roles define organizational positions (like "Cook", "Cashier", "Manager") 
          while system roles control access permissions. Users can have multiple job roles but only one system role.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Manage Roles
          </TabsTrigger>
          <TabsTrigger value="assign" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Bulk Actions
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Job Roles Management
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Create and manage organizational positions and job functions
                </p>
              </div>
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
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Job roles represent positions within your organization (e.g., "Senior Developer", "Kitchen Manager", "Sales Associate").
                      </AlertDescription>
                    </Alert>
                    <div>
                      <Label htmlFor="name">Job Role Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Senior Cook, Store Manager, Lead Developer"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Job Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the role responsibilities, requirements, and expectations..."
                        rows={4}
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
                        {isCreating ? 'Creating...' : 'Create Job Role'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {jobRoles.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                  <h3 className="text-lg font-semibold mb-2">No Job Roles Created</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Start by creating job roles that represent positions within your organization. 
                    This helps organize your team structure and assign appropriate responsibilities.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Job Role
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Role Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Users</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Briefcase className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{role.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {role.description ? (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {role.description}
                              </p>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={role.is_active ? "default" : "secondary"}>
                            {role.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            0 users
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
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
                                Edit Role
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
                                Delete Role
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
        </TabsContent>

        <TabsContent value="assign">
          <JobRoleAssignmentDashboard />
        </TabsContent>

        <TabsContent value="bulk">
          <BulkUserAssignment />
        </TabsContent>

        <TabsContent value="analytics">
          <JobRoleAnalytics />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Job Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Job Role Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Senior Cook, Store Manager, Lead Developer"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Job Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the role responsibilities, requirements, and expectations..."
                rows={4}
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
                {isUpdating ? 'Updating...' : 'Update Job Role'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};