import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTemplateRequirements } from '@/hooks/document-templates';

interface AddRequirementDialogProps {
  templateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DOCUMENT_TYPES = [
  'w4', 'employment_application', 'food_handler_certificate', 'drivers_license',
  'social_security_card', 'i9', 'direct_deposit', 'emergency_contact',
  'handbook_acknowledgment', 'uniform_agreement', 'background_check', 'other'
];

export const AddRequirementDialog = ({ templateId, open, onOpenChange }: AddRequirementDialogProps) => {
  const { createRequirement } = useTemplateRequirements();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const [isRequired, setIsRequired] = useState(true);
  const [requiresExpiry, setRequiresExpiry] = useState(false);
  const [documentType, setDocumentType] = useState('');

  const onSubmit = async (data: any) => {
    await createRequirement.mutateAsync({
      template_id: templateId,
      document_name: data.document_name,
      document_type: documentType,
      is_required: isRequired,
      requires_expiry: requiresExpiry,
      default_validity_days: requiresExpiry ? parseInt(data.default_validity_days) : undefined,
      instructions: data.instructions || undefined,
      max_file_size_mb: parseInt(data.max_file_size_mb) || 10,
      display_order: 0,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Document Requirement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document_name">Document Name *</Label>
            <Input
              id="document_name"
              {...register('document_name', { required: 'Document name is required' })}
              placeholder="e.g., W4 Tax Form, Food Handler Certificate"
            />
            {errors.document_name && (
              <p className="text-sm text-destructive">{errors.document_name.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="document_type">Document Type *</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              {...register('instructions')}
              placeholder="Provide instructions for uploading this document..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_file_size_mb">Max File Size (MB)</Label>
              <Input
                id="max_file_size_mb"
                type="number"
                {...register('max_file_size_mb')}
                defaultValue="10"
                min="1"
                max="50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_validity_days">Validity (Days)</Label>
              <Input
                id="default_validity_days"
                type="number"
                {...register('default_validity_days')}
                placeholder="365"
                disabled={!requiresExpiry}
                min="1"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Required Document</Label>
                <p className="text-sm text-muted-foreground">
                  Employee must upload this document
                </p>
              </div>
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Requires Renewal</Label>
                <p className="text-sm text-muted-foreground">
                  Document has an expiration date
                </p>
              </div>
              <Switch checked={requiresExpiry} onCheckedChange={setRequiresExpiry} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRequirement.isPending || !documentType}>
              {createRequirement.isPending ? 'Adding...' : 'Add Document'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
