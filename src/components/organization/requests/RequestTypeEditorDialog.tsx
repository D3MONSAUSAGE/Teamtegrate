import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { RequestType, FormField } from '@/types/requests';
import { REQUEST_CATEGORIES } from '@/types/requests';
import { toast } from '@/components/ui/sonner';
import { addOrgIdToInsert } from '@/utils/organizationHelpers';
import { ALL_ROLES } from '@/hooks/access-control/useAccessControlData';
import JobRoleSelector from './JobRoleSelector';
import UserAssignmentSelector from './UserAssignmentSelector';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: RequestType | null;
  onSaved: () => void;
}

export default function RequestTypeEditorDialog({ open, onOpenChange, initial, onSaved }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<keyof typeof REQUEST_CATEGORIES>('custom');
  const [description, setDescription] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [approvalRolesText, setApprovalRolesText] = useState('manager');
  const [formSchemaText, setFormSchemaText] = useState('[]');
  const [isActive, setIsActive] = useState(true);
  const [creatorRoles, setCreatorRoles] = useState<string[]>([]);
  const [viewerRoles, setViewerRoles] = useState<string[]>([]);
  const [defaultJobRoles, setDefaultJobRoles] = useState<string[]>([]);
  const [expertiseTags, setExpertiseTags] = useState<string[]>([]);
  const [geographicScope, setGeographicScope] = useState('any');
  const [workloadBalancing, setWorkloadBalancing] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [assignmentStrategy, setAssignmentStrategy] = useState('first_available');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setName(initial.name || '');
      setCategory((initial.category as keyof typeof REQUEST_CATEGORIES) || 'custom');
      setDescription(initial.description || '');
      setRequiresApproval(!!initial.requires_approval);
      setApprovalRolesText((initial.approval_roles || ['manager']).join(','));
      setFormSchemaText(JSON.stringify(initial.form_schema || [], null, 2));
      setIsActive(!!initial.is_active);
      setCreatorRoles((initial as any).creator_role_restrictions || []);
      setViewerRoles((initial as any).viewer_role_restrictions || []);
      setDefaultJobRoles((initial as any).default_job_roles || []);
      setExpertiseTags((initial as any).expertise_tags || []);
      setGeographicScope((initial as any).geographic_scope || 'any');
      setWorkloadBalancing((initial as any).workload_balancing_enabled ?? true);
      setSelectedUserIds((initial as any).selected_user_ids || []);
      setAssignmentStrategy((initial as any).assignment_strategy || 'first_available');
    } else {
      setName('');
      setCategory('custom');
      setDescription('');
      setRequiresApproval(false);
      setApprovalRolesText('manager');
      setFormSchemaText('[\n  {\n    "field": "title",\n    "type": "text",\n    "label": "Title",\n    "required": true,\n    "placeholder": "Enter a short title"\n  }\n]');
      setIsActive(true);
      setCreatorRoles([]);
      setViewerRoles([]);
      setDefaultJobRoles([]);
      setExpertiseTags([]);
      setGeographicScope('any');
      setWorkloadBalancing(true);
      setSelectedUserIds([]);
      setAssignmentStrategy('first_available');
    }
  }, [initial, open]);

  const handleSave = async () => {
    if (!user?.organizationId) {
      toast.error('Organization context required');
      return;
    }

    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    let parsedSchema: FormField[] = [];
    try {
      parsedSchema = JSON.parse(formSchemaText);
      if (!Array.isArray(parsedSchema)) throw new Error('form_schema must be an array');
    } catch (e: any) {
      toast.error(`Invalid form schema JSON: ${e.message}`);
      return;
    }

    const payload = {
      name: name.trim(),
      category,
      description: description.trim() || null,
      form_schema: parsedSchema as any,
      requires_approval: requiresApproval,
      approval_roles: approvalRolesText.split(',').map(r => r.trim()).filter(Boolean),
      is_active: isActive,
      created_by: user.id,
      required_permissions: [{ module_id: 'requests', action_id: 'create' }],
      creator_role_restrictions: creatorRoles.length > 0 ? creatorRoles : null,
      viewer_role_restrictions: viewerRoles.length > 0 ? viewerRoles : null,
      default_job_roles: defaultJobRoles.length > 0 ? defaultJobRoles : null,
      expertise_tags: expertiseTags.length > 0 ? expertiseTags : null,
      geographic_scope: geographicScope,
      workload_balancing_enabled: workloadBalancing,
      selected_user_ids: selectedUserIds.length > 0 ? selectedUserIds : null,
      assignment_strategy: assignmentStrategy,
      permission_metadata: {}
    } as Partial<RequestType> & { created_by: string };

    setSaving(true);
    try {
      if (initial) {
        const { error } = await supabase
          .from('request_types')
          .update(payload as any)
          .eq('id', initial.id)
          .eq('organization_id', user.organizationId);
        if (error) throw error;
        toast.success('Request type updated');
      } else {
        const insertData = addOrgIdToInsert(payload as any, { id: user.id, organization_id: user.organizationId });
        const { error } = await supabase
          .from('request_types')
          .insert(insertData as any);
        if (error) throw error;
        toast.success('Request type created');
      }
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save request type');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{initial ? 'Edit Request Type' : 'New Request Type'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <div className="grid gap-6 py-4">
            {/* Basic Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Equipment Request" />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select id="category" className="w-full rounded-md border bg-background px-3 py-2" value={category}
                      onChange={(e) => setCategory(e.target.value as keyof typeof REQUEST_CATEGORIES)}>
                      {Object.keys(REQUEST_CATEGORIES).map((key) => (
                        <option key={key} value={key}>{REQUEST_CATEGORIES[key as keyof typeof REQUEST_CATEGORIES]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <Label>Requires Approval</Label>
                      <p className="text-sm text-muted-foreground">If enabled, approvals will be required.</p>
                    </div>
                    <Switch checked={requiresApproval} onCheckedChange={setRequiresApproval} />
                  </div>
                  <div className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <Label>Active</Label>
                      <p className="text-sm text-muted-foreground">Inactive types are hidden from users.</p>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                </div>

                {requiresApproval && (
                  <div>
                    <Label htmlFor="approval_roles">Approval Roles (comma-separated)</Label>
                    <Input id="approval_roles" value={approvalRolesText} onChange={(e) => setApprovalRolesText(e.target.value)} placeholder="manager,admin" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignment Configuration Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assignment Configuration</CardTitle>
                <p className="text-sm text-muted-foreground">Configure how requests of this type are assigned to users</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Job Role-Based Assignment</h4>
                  <JobRoleSelector
                    selectedRoles={defaultJobRoles}
                    onSelectionChange={setDefaultJobRoles}
                    expertiseTags={expertiseTags}
                    onExpertiseChange={setExpertiseTags}
                    geographicScope={geographicScope}
                    onGeographicScopeChange={setGeographicScope}
                    workloadBalancing={workloadBalancing}
                    onWorkloadBalancingChange={setWorkloadBalancing}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-3">User-Specific Assignment</h4>
                  <UserAssignmentSelector
                    selectedUserIds={selectedUserIds}
                    onSelectionChange={setSelectedUserIds}
                    assignmentStrategy={assignmentStrategy}
                    onStrategyChange={setAssignmentStrategy}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Permission Configuration Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Permission Configuration</CardTitle>
                <p className="text-sm text-muted-foreground">Control who can create and view requests of this type</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Creator Role Restrictions</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Select which roles can create requests of this type. Leave empty to allow all roles.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_ROLES.map(role => (
                      <Badge
                        key={role}
                        variant={creatorRoles.includes(role) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          if (creatorRoles.includes(role)) {
                            setCreatorRoles(prev => prev.filter(r => r !== role));
                          } else {
                            setCreatorRoles(prev => [...prev, role]);
                          }
                        }}
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Viewer Role Restrictions</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Select which roles can view requests of this type. Leave empty to follow default access rules.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_ROLES.map(role => (
                      <Badge
                        key={role}
                        variant={viewerRoles.includes(role) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          if (viewerRoles.includes(role)) {
                            setViewerRoles(prev => prev.filter(r => r !== role));
                          } else {
                            setViewerRoles(prev => [...prev, role]);
                          }
                        }}
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Schema Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Form Schema</CardTitle>
                <p className="text-sm text-muted-foreground">Define the custom form fields for this request type</p>
              </CardHeader>
              <CardContent>
                <Label htmlFor="form_schema">Form Schema (JSON)</Label>
                <Textarea 
                  id="form_schema" 
                  value={formSchemaText} 
                  onChange={(e) => setFormSchemaText(e.target.value)} 
                  rows={10} 
                  className="font-mono mt-2" 
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
