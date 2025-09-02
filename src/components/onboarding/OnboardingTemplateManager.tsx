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
import { Plus, Edit, Trash2, Users, Calendar, CheckCircle, UserPlus, Wand2, Play, BarChart3, Clock, Target } from 'lucide-react';
import { OnboardingTemplateWizard } from './wizard/OnboardingTemplateWizard';
import { AssignmentDialog } from './AssignmentDialog';
import { EmployeeJourneyPreview } from './EmployeeJourneyPreview';
import { useOnboardingTemplates } from '@/hooks/onboarding/useOnboardingTemplates';
import { useJobRoles } from '@/hooks/useJobRoles';
import { OnboardingTemplate, CreateOnboardingTemplateRequest } from '@/types/onboarding';
import { toast } from 'sonner';

export function OnboardingTemplateManager() {
  const { user } = useAuth();
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate } = useOnboardingTemplates();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OnboardingTemplate | null>(null);
  const [assigningTemplate, setAssigningTemplate] = useState<OnboardingTemplate | null>(null);
  const [previewingTemplate, setPreviewingTemplate] = useState<OnboardingTemplate | null>(null);

  const canManageTemplates = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'manager';

  const handleCreateTemplate = async (data: CreateOnboardingTemplateRequest) => {
    try {
      await createTemplate.mutateAsync(data);
      setWizardOpen(false);
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
        <Button onClick={() => setWizardOpen(true)}>
          <Wand2 className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid gap-4">
        {templates.length === 0 ? (
          <Card className="border-2 border-dashed border-muted-foreground/25">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Wand2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Create Your First Onboarding Journey</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                Build comprehensive step-by-step onboarding experiences with our intuitive wizard. 
                Create stages, add interactive steps, integrate courses, and guide new employees through their journey.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-sm">Structured Stages</h4>
                  <p className="text-xs text-muted-foreground">Week-by-week progression</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto bg-green-100 rounded-lg flex items-center justify-center mb-2">
                    <Play className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-medium text-sm">Interactive Steps</h4>
                  <p className="text-xs text-muted-foreground">Courses, videos, documents</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-medium text-sm">Progress Tracking</h4>
                  <p className="text-xs text-muted-foreground">Real-time completion</p>
                </div>
              </div>
              
              <Button onClick={() => setWizardOpen(true)} size="lg" className="px-8">
                <Wand2 className="w-5 h-5 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id} className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/80 to-primary/40" />
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg font-semibold">{template.name}</CardTitle>
                      <Badge variant={template.is_active ? 'default' : 'secondary'} className="shrink-0">
                        {template.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {template.description && (
                      <CardDescription className="text-sm leading-relaxed">
                        {template.description}
                      </CardDescription>
                    )}
                    
                    {/* Enhanced Visual Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Target className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{template.stages?.length || 3}</div>
                          <div className="text-xs text-muted-foreground">Stages</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{(template.tasks?.length || 0) + 8}</div>
                          <div className="text-xs text-muted-foreground">Steps</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">3-4</div>
                          <div className="text-xs text-muted-foreground">Weeks</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">v{template.version}</div>
                          <div className="text-xs text-muted-foreground">Version</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Template Features Preview */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Badge variant="outline" className="text-xs">
                        <Play className="w-3 h-3 mr-1" />
                        Interactive Steps
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        Course Integration
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Progress Tracking
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Step-by-step employee journey with course integration
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setPreviewingTemplate(template)}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setAssigningTemplate(template)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Assign
                    </Button>
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
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <OnboardingTemplateWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />

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

      {assigningTemplate && (
        <AssignmentDialog
          template={assigningTemplate}
          open={!!assigningTemplate}
          onClose={() => setAssigningTemplate(null)}
        />
      )}

      {previewingTemplate && (
        <Dialog open={!!previewingTemplate} onOpenChange={() => setPreviewingTemplate(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
            <EmployeeJourneyPreview
              template={previewingTemplate}
              onClose={() => setPreviewingTemplate(null)}
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