
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm, useFieldArray } from "react-hook-form";
import { useProjectOperations } from '@/hooks/useProjectOperations';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { format } from 'date-fns';
import { useUsers } from '@/hooks/useUsers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamMembersSection, FormValues } from "@/components/project/TeamMembersSection";
import { ProjectDetailsSection } from '@/components/project/ProjectDetailsSection';
import { TagsSection } from '@/components/project/TagsSection';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { user } = useAuth();
  const { createProject, isLoading } = useProjectOperations();
  const { users } = useUsers();
  
  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      budget: undefined,
      teamMembers: [],
      tags: [],
    }
  });
  
  const { fields: teamMemberFields, append: appendTeamMember, remove: removeTeamMember } = useFieldArray({
    control,
    name: "teamMembers"
  });

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast.error('You must be logged in to create a project');
      return;
    }

    try {
      console.log("Submitting project data:", data);
      
      // Extract team member IDs from the form data
      const teamMemberIds = data.teamMembers.map(member => member.memberId);
      
      const project = await createProject({
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        managerId: user.id,
        budget: data.budget,
        teamMembers: teamMemberIds,
        status: 'To Do',
        tasks_count: 0,
        tags: data.tags || [],
        is_completed: false
      });
      
      if (project) {
        onOpenChange(false);
        reset();
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Create a new project to organize your tasks and collaborate with team members.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Project Details</TabsTrigger>
              <TabsTrigger value="team">Team Members</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <ProjectDetailsSection 
                register={register}
                errors={errors}
              />
            </TabsContent>
            
            <TabsContent value="team">
              <TeamMembersSection 
                teamMembers={users}
                teamMemberFields={teamMemberFields}
                setValue={setValue}
                watch={watch}
                fieldArrayProps={{
                  append: appendTeamMember,
                  remove: removeTeamMember
                }}
              />
            </TabsContent>

            <TabsContent value="tags">
              <TagsSection 
                watch={watch}
                setValue={setValue}
              />
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
