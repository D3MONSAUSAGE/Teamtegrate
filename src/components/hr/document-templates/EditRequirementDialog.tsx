import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useTemplateRequirements } from '@/hooks/document-templates';
import type { TemplateDocumentRequirement } from '@/types/document-templates';

interface EditRequirementDialogProps {
  requirement: TemplateDocumentRequirement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditRequirementDialog = ({ requirement, open, onOpenChange }: EditRequirementDialogProps) => {
  const { updateRequirement } = useTemplateRequirements();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      document_name: requirement.document_name,
      instructions: requirement.instructions || '',
      max_file_size_mb: requirement.max_file_size_mb,
      default_validity_days: requirement.default_validity_days || 365,
    },
  });
  const [isRequired, setIsRequired] = useState(requirement.is_required);
  const [requiresExpiry, setRequiresExpiry] = useState(requirement.requires_expiry);

  useEffect(() => {
    reset({
      document_name: requirement.document_name,
      instructions: requirement.instructions || '',
      max_file_size_mb: requirement.max_file_size_mb,
      default_validity_days: requirement.default_validity_days || 365,
    });
    setIsRequired(requirement.is_required);
    setRequiresExpiry(requirement.requires_expiry);
  }, [requirement, reset]);

  const onSubmit = async (data: any) => {
    await updateRequirement.mutateAsync({
      id: requirement.id,
      updates: {
        ...data,
        is_required: isRequired,
        requires_expiry: requiresExpiry,
        default_validity_days: requiresExpiry ? parseInt(data.default_validity_days) : undefined,
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Document Requirement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-document_name">Document Name</Label>
            <Input
              id="edit-document_name"
              {...register('document_name', { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-instructions">Instructions</Label>
            <Textarea
              id="edit-instructions"
              {...register('instructions')}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-max_file_size_mb">Max File Size (MB)</Label>
              <Input
                id="edit-max_file_size_mb"
                type="number"
                {...register('max_file_size_mb')}
                min="1"
                max="50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-default_validity_days">Validity (Days)</Label>
              <Input
                id="edit-default_validity_days"
                type="number"
                {...register('default_validity_days')}
                disabled={!requiresExpiry}
                min="1"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Required Document</Label>
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
            </div>

            <div className="flex items-center justify-between">
              <Label>Requires Renewal</Label>
              <Switch checked={requiresExpiry} onCheckedChange={setRequiresExpiry} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateRequirement.isPending}>
              {updateRequirement.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
