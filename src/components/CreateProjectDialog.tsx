
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import useTeamMembers from '@/hooks/useTeamMembers';
import ProjectFormFields from './project/ProjectFormFields';
import TeamMembersSection from './project/TeamMembersSection';
import ProjectTasksSection from './project/ProjectTasksSection';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectDialogProps } from './project/ProjectFormTypes';
import { useProjectForm } from '@/hooks/useProjectForm';

const CreateProjectDialog: React.FC<ProjectDialogProps> = ({ 
  open, 
  onOpenChange, 
  editingProject 
}) => {
  const { user } = useAuth();
  const { addProject, updateProject } = useTask();
  const { teamMembers } = useTeamMembers();
  
  const isEditMode = !!editingProject;
  
  const {
    register,
    handleSubmit,
    errors,
    reset,
    setValue,
    control,
    watch,
    teamMemberArray,
    taskArray
  } = useProjectForm(editingProject);

  React.useEffect(() => {
    if (editingProject) {
      setValue('title', editingProject.title);
      setValue('description', editingProject.description);
      setValue('startDate', format(new Date(editingProject.startDate), 'yyyy-MM-dd'));
      setValue('endDate', format(new Date(editingProject.endDate), 'yyyy-MM-dd'));
      setValue('budget', editingProject.budget || '');
      setValue('teamMembers', editingProject.teamMembers?.map((id) => ({ memberId: id })) || []);
    } else {
      reset();
    }
  }, [editingProject, setValue, reset]);
  
  const onSubmit = (data: FormValues) => {
    if (!user) return;
    
    const projectData = {
      title: data.title,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      managerId: user.id,
      budget: data.budget ? Number(data.budget) : undefined,
      teamMembers: data.teamMembers.map((tm) => tm.memberId),
      tasks: data.tasks.map((task) => ({
        title: task.title,
        description: task.description,
        priority: task.priority as TaskPriority,
        deadline: new Date(task.deadline),
        status: 'To Do' as TaskStatus
      }))
    };
    
    if (isEditMode && editingProject) {
      updateProject(editingProject.id, projectData);
    } else {
      addProject(projectData);
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
          <Button type="submit" form="project-form">
            {isEditMode ? 'Update' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
