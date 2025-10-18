import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDocumentTemplates } from '@/hooks/document-templates';
import { RequirementsBuilder } from './RequirementsBuilder';
import type { EmployeeDocumentTemplate } from '@/types/document-templates';

interface EditTemplateDialogProps {
  template: EmployeeDocumentTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditTemplateDialog = ({ template, open, onOpenChange }: EditTemplateDialogProps) => {
  const { updateTemplate } = useDocumentTemplates();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: template.name,
      description: template.description || '',
    },
  });
  const [isActive, setIsActive] = useState(template.is_active);

  useEffect(() => {
    reset({
      name: template.name,
      description: template.description || '',
    });
    setIsActive(template.is_active);
  }, [template, reset]);

  const onSubmit = async (data: any) => {
    await updateTemplate.mutateAsync({
      id: template.id,
      updates: {
        ...data,
        is_active: isActive,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Template: {template.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Template Details</TabsTrigger>
            <TabsTrigger value="requirements">Document Requirements</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Template Name *</Label>
                <Input
                  id="edit-name"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  {...register('description')}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="edit-is_active">Active Template</Label>
                  <p className="text-sm text-muted-foreground">
                    Active templates will be available for assignment
                  </p>
                </div>
                <Switch
                  id="edit-is_active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button type="submit" disabled={updateTemplate.isPending}>
                  {updateTemplate.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="requirements" className="mt-4">
            <RequirementsBuilder templateId={template.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
