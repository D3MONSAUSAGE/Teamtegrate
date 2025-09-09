import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { RequestType, FormField } from '@/types/requests';
import { REQUEST_CATEGORIES } from '@/types/requests';
import { toast } from '@/components/ui/sonner';
import { addOrgIdToInsert } from '@/utils/organizationHelpers';

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
    } else {
      setName('');
      setCategory('custom');
      setDescription('');
      setRequiresApproval(false);
      setApprovalRolesText('manager');
      setFormSchemaText('[\n  {\n    "field": "title",\n    "type": "text",\n    "label": "Title",\n    "required": true,\n    "placeholder": "Enter a short title"\n  }\n]');
      setIsActive(true);
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Request Type' : 'New Request Type'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
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

          <div>
            <Label htmlFor="approval_roles">Approval Roles (comma-separated)</Label>
            <Input id="approval_roles" value={approvalRolesText} onChange={(e) => setApprovalRolesText(e.target.value)} placeholder="manager,admin" />
          </div>

          <div>
            <Label htmlFor="form_schema">Form Schema (JSON)</Label>
            <Textarea id="form_schema" value={formSchemaText} onChange={(e) => setFormSchemaText(e.target.value)} rows={10} className="font-mono" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
