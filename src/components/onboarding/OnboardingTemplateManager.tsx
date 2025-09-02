import { useState } from 'react';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Users, Calendar, CheckCircle } from 'lucide-react';
import { useOnboardingTemplates } from '@/hooks/onboarding/useOnboardingTemplates';
import { useJobRoles } from '@/hooks/useJobRoles';
import { OnboardingTemplate, CreateOnboardingTemplateRequest } from '@/types/onboarding';
import { toast } from 'sonner';

export function OnboardingTemplateManager() {
  const { user } = useAuth();
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate } = useOnboardingTemplates();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OnboardingTemplate | null>(null);

  const canManageTemplates = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'manager';

  const handleCreateTemplate = async (data: CreateOnboardingTemplateRequest) => {
    try {
      await createTemplate.mutateAsync(data);
      setCreateDialogOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleUpdateTemplate = async (id: string, data: Partial<OnboardingTemplate>) => {
    try {
      await updateTemplate.mutateAsync({ id, ...data });
      setEditingTemplate(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this template?')) return;
    
    try {
      await deleteTemplate.mutateAsync(id);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (!canManageTemplates) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have permission to manage onboarding templates.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Onboarding Templates</h2>
          <p className="text-muted-foreground">Create and manage onboarding workflows for different roles</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Onboarding Template</DialogTitle>
            </DialogHeader>
            <TemplateForm
              onSubmit={handleCreateTemplate}
              isSubmitting={createTemplate.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first onboarding template to get started
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  {template.description && (
                    <CardDescription>{template.description}</CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={template.is_active ? 'default' : 'secondary'}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingTemplate(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    {template.tasks?.length || 0} tasks
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Version {template.version}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {template.stages?.length || 0} stages
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
            </DialogHeader>
            <TemplateForm
              template={editingTemplate}
              onSubmit={(data) => handleUpdateTemplate(editingTemplate.id, data)}
              isSubmitting={updateTemplate.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface TemplateFormProps {
  template?: OnboardingTemplate;
  onSubmit: (data: CreateOnboardingTemplateRequest) => void;
  isSubmitting: boolean;
}

function TemplateForm({ template, onSubmit, isSubmitting }: TemplateFormProps) {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [roleId, setRoleId] = useState(template?.role_id || '');
  
  const { jobRoles, isLoading: isLoadingRoles } = useJobRoles();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description: description || undefined,
      role_id: roleId || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Template Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Software Engineer Onboarding"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this template covers..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Target Job Role (Optional)</Label>
        <Select value={roleId} onValueChange={setRoleId} disabled={isLoadingRoles || jobRoles.length === 0}>
          <SelectTrigger>
            <SelectValue placeholder={
              isLoadingRoles 
                ? "Loading roles..." 
                : jobRoles.length === 0 
                ? "No job roles available" 
                : "Select a job role..."
            } />
          </SelectTrigger>
          <SelectContent>
            {jobRoles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting || isLoadingRoles}>
          {isSubmitting ? 'Saving...' : template ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

export default OnboardingTemplateManager;