
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useForm, useFieldArray } from "react-hook-form";
import { Project, Task, TaskPriority } from '@/types';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import useTeamMembers from '@/hooks/useTeamMembers';
import ProjectFormFields from './project/ProjectFormFields';
import TeamMembersSection from './project/TeamMembersSection';
import ProjectTasksSection from './project/ProjectTasksSection';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProject?: Project;
}

export type FormValues = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: string | number;
  teamMembers: { memberId: string }[];
  tasks: { title: string; description: string; priority: TaskPriority; deadline: string }[];
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
      tasks: [] as { title: string; description: string; priority: TaskPriority; deadline: string }[],
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
    
    const projectData: Omit<Project, 'id' | 'tasks' | 'createdAt' | 'updatedAt'> = {
      title: data.title,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      managerId: user.id,
      budget: data.budget ? Number(data.budget) : undefined,
      teamMembers: data.teamMembers.map(tm => tm.memberId),
      is_completed: false
    };
    
    const taskData = data.tasks.map(task => ({
      title: task.title,
      description: task.description,
      priority: task.priority,
      deadline: new Date(task.deadline),
      status: 'To Do' as const,
    }));
    
    if (isEditMode && editingProject) {
      updateProject(editingProject.id, { 
        ...projectData,
        tasks: [...(editingProject.tasks || []), ...taskData] as Task[]
      });
    } else {
      addProject({
        ...projectData,
        tasks: taskData as unknown as Task[]
      } as Project);
    }
    
    onOpenChange(false);
    reset();
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Project' : 'Create New Project'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto pr-2">
          <ProjectFormFields
            register={register}
            errors={errors}
            editingProject={editingProject}
          />

          <Separator className="my-4" />
          
          <TeamMembersSection<FormValues>
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
          
          <ProjectTasksSection<FormValues>
            taskFields={taskArray.fields}
            register={register}
            setValue={setValue}
            watch={watch}
            fieldArrayProps={{
              append: taskArray.append,
              remove: taskArray.remove
            }}
          />
          
          <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background">
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
            <Button type="submit">{isEditMode ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
