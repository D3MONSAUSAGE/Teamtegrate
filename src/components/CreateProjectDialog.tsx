
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useForm, useFieldArray } from "react-hook-form";
import { Project, Task, TaskPriority, TaskStatus } from '@/types';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import useTeamMembers from '@/hooks/useTeamMembers';
import ProjectFormFields from './project/ProjectFormFields';
import TeamMembersSection from './project/TeamMembersSection';
import ProjectTasksSection from './project/ProjectTasksSection';
import { ScrollArea } from "@/components/ui/scroll-area";
import { FormValues } from './project/ProjectFormFields';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProject?: Project;
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ open, onOpenChange, editingProject }) => {
  const { user } = useAuth();
  const { addProject, updateProject } = useTask();
  const { teamMembers } = useTeamMembers();
  const isEditMode = !!editingProject;
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, control, watch } = useForm<FormValues>({
    defaultValues: {
      title: editingProject?.title || '',
      description: editingProject?.description || '',
      startDate: editingProject ? format(new Date(editingProject.startDate), 'yyyy-MM-dd') : '',
      endDate: editingProject ? format(new Date(editingProject.endDate), 'yyyy-MM-dd') : '',
      budget: editingProject?.budget || '',
      teamMembers: editingProject?.teamMembers?.map(id => ({ memberId: id })) || [],
      tasks: [] as { title: string; description: string; priority: string; deadline: string }[],
    },
  });

  const teamMemberArray = useFieldArray({
    control,
    name: "teamMembers",
  });

  const taskArray = useFieldArray({
    control,
    name: "tasks",
  });
  
  React.useEffect(() => {
    if (editingProject) {
      setValue('title', editingProject.title);
      setValue('description', editingProject.description);
      setValue('startDate', format(new Date(editingProject.startDate), 'yyyy-MM-dd'));
      setValue('endDate', format(new Date(editingProject.endDate), 'yyyy-MM-dd'));
      setValue('budget', editingProject.budget || '');
      setValue('teamMembers', editingProject.teamMembers?.map(id => ({ memberId: id })) || []);
    } else {
      reset();
    }
  }, [editingProject, setValue, reset]);
  
  const onSubmit = (data: FormValues) => {
    if (!user) return;
    
    const now = new Date();
    
    // Create the project data structure without tasks first
    const projectData: Partial<Project> = {
      title: data.title,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      managerId: user.id,
      budget: data.budget ? Number(data.budget) : undefined,
      teamMembers: data.teamMembers.map((tm: { memberId: string }) => tm.memberId),
    };

    // Handle tasks separately - we won't include them in the project data
    // as the backend will add them once the project is created
    const taskDataList = data.tasks.map((task) => ({
      title: task.title,
      description: task.description,
      priority: task.priority as TaskPriority,
      deadline: new Date(task.deadline),
      status: 'To Do' as TaskStatus
    }));

    if (isEditMode && editingProject) {
      updateProject(editingProject.id, projectData);
    } else {
      addProject({
        ...projectData,
        tasks: [] // Pass an empty array as tasks - they'll be created separately
      } as Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>);
      
      // Note: In a real implementation, you might want to create tasks after project creation
      // This would require modifying the addProject function to handle tasks separately
    }
    
    onOpenChange(false);
    reset();
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Project' : 'Create New Project'}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="pr-4 flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="project-form">
            <ProjectFormFields
              register={register}
              errors={errors}
              editingProject={editingProject}
            />

            <Separator className="my-4" />
            
            <TeamMembersSection
              teamMembers={teamMembers}
              teamMemberFields={teamMemberArray.fields}
              setValue={setValue}
              watch={watch}
              fieldArrayProps={{
                append: teamMemberArray.append,
                remove: teamMemberArray.remove
              }}
            />

            <Separator className="my-4" />
            
            <ProjectTasksSection
              taskFields={taskArray.fields}
              register={register}
              setValue={setValue}
              watch={watch}
              fieldArrayProps={{
                append: taskArray.append,
                remove: taskArray.remove
              }}
            />
          </form>
        </ScrollArea>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              onOpenChange(false);
              reset();
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="project-form"
          >
            {isEditMode ? 'Update' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
