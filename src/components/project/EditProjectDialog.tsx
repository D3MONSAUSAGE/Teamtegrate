
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Project } from '@/types';
import { ProjectDetailsSection } from './ProjectDetailsSection';
import { TeamMembersSection } from './TeamMembersSection';
import { toast } from '@/components/ui/sonner';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { updateProject as updateProjectOperation } from '@/contexts/task/operations/updateProject';
import { useUsers } from '@/hooks/useUsers';

// Define the validation schema - making memberId required in team members
const projectFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  startDate: z.string().min(1, { message: "Start date is required" }),
  endDate: z.string().min(1, { message: "End date is required" }),
  budget: z.number().optional().nullable(),
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
  const { user } = useAuth();
  const { setProjects } = useProjects();
  const { users, isLoading: loadingUsers } = useUsers();
  
  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: project?.title || '',
      description: project?.description || '',
      startDate: project?.startDate || '',
      endDate: project?.endDate || '',
      budget: project?.budget,
      teamMembers: project?.teamMemberIds?.map(memberId => ({ memberId })) || []
    }
  });

  const { fields: teamMemberFields, append, remove } = useFieldArray({
    control,
    name: "teamMembers"
  });
  
  // Update form when project changes or dialog opens
  useEffect(() => {
    if (project && open) {
      console.log('Resetting form with project data:', project);
      reset({
        title: project.title || '',
        description: project.description || '',
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        budget: project.budget,
        teamMembers: project.teamMemberIds?.map(memberId => ({ memberId })) || []
      });
    }
  }, [project, open, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      console.log('Submitting project update:', data);
      
      if (!user) {
        toast.error('User not authenticated');
        return;
      }
      
      // Extract team member IDs from the form data
      const teamMemberIds = data.teamMembers?.map(tm => tm.memberId) || [];
      
      // Use the operation function directly with proper parameters
      await updateProjectOperation(project.id, {
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        budget: data.budget,
        teamMemberIds: teamMemberIds
      }, user, setProjects);
      
      toast.success("Project updated successfully");
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    }
  };

  const handleCancel = () => {
    console.log('Edit dialog cancelled');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project: {project?.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <ProjectDetailsSection 
            register={register}
            errors={errors}
          />
          
          {!loadingUsers && users.length > 0 && (
            <TeamMembersSection
              teamMembers={users}
              teamMemberFields={teamMemberFields}
              setValue={setValue}
              watch={watch}
              fieldArrayProps={{ append, remove }}
            />
          )}
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSubmitting}
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
