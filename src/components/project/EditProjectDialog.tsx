
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Project } from '@/types';
import { ProjectDetailsSection } from './ProjectDetailsSection';
import { toast } from '@/components/ui/sonner';
import { format } from 'date-fns';
import { useTask } from '@/contexts/task';

// Define the validation schema
const projectFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  startDate: z.string().min(1, { message: "Start date is required" }),
  endDate: z.string().min(1, { message: "End date is required" }),
  budget: z.number().optional(),
  teamMembers: z.array(z.object({ memberId: z.string() })).optional().default([])
});

export type FormValues = z.infer<typeof projectFormSchema>;

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onSuccess?: () => void;
}

const EditProjectDialog: React.FC<EditProjectDialogProps> = ({
  open,
  onOpenChange,
  project,
  onSuccess
}) => {
  const { updateProject } = useTask();
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: project?.title || '',
      description: project?.description || '',
      startDate: project?.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : '',
      endDate: project?.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : '',
      budget: project?.budget,
      teamMembers: []
    }
  });
  
  // Update form when project changes
  useEffect(() => {
    if (project && open) {
      reset({
        title: project.title || '',
        description: project.description || '',
        startDate: project.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : '',
        endDate: project.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : '',
        budget: project.budget,
        teamMembers: []
      });
    }
  }, [project, open, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      await updateProject(project.id, {
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        budget: data.budget
      });
      
      toast.success("Project updated successfully");
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ProjectDetailsSection 
            register={register}
            errors={errors}
          />
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectDialog;
