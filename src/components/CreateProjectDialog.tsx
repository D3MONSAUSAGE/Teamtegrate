
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm, useFieldArray } from "react-hook-form";
import { Project, Task, TaskPriority } from '@/types';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import useTeamMembers from '@/hooks/useTeamMembers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { X, Plus } from 'lucide-react';

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
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, control, watch } = useForm({
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

  const { fields: teamMemberFields, append: appendTeamMember, remove: removeTeamMember } = useFieldArray({
    control,
    name: "teamMembers",
  });

  const { fields: taskFields, append: appendTask, remove: removeTask } = useFieldArray({
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
  
  const onSubmit = (data: any) => {
    if (!user) return;
    
    const projectData = {
      title: data.title,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      managerId: user.id,
      budget: data.budget ? Number(data.budget) : undefined,
      teamMembers: data.teamMembers.map((tm: { memberId: string }) => tm.memberId),
      tasks: data.tasks.map((task: any) => ({
        title: task.title,
        description: task.description,
        priority: task.priority as TaskPriority,
        deadline: new Date(task.deadline),
        status: 'To Do' as const,
      })),
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Project' : 'Create New Project'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              placeholder="Project title"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && (
              <span className="text-xs text-red-500">{errors.title.message as string}</span>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Project description"
              {...register('description')}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date <span className="text-red-500">*</span></Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate', { required: 'Start date is required' })}
              />
              {errors.startDate && (
                <span className="text-xs text-red-500">{errors.startDate.message as string}</span>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date <span className="text-red-500">*</span></Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate', { required: 'End date is required' })}
              />
              {errors.endDate && (
                <span className="text-xs text-red-500">{errors.endDate.message as string}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter project budget (optional)"
              {...register('budget')}
            />
          </div>

          <Separator className="my-4" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Team Members</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => appendTeamMember({ memberId: '' })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Member
              </Button>
            </div>
            
            {teamMemberFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Select
                  onValueChange={(value) => setValue(`teamMembers.${index}.memberId`, value)}
                  value={watch(`teamMembers.${index}.memberId`)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  onClick={() => removeTeamMember(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Separator className="my-4" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Initial Tasks</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => appendTask({ 
                  title: '', 
                  description: '', 
                  priority: 'Medium',
                  deadline: '' 
                })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            </div>
            
            {taskFields.map((field, index) => (
              <div key={field.id} className="space-y-4 p-4 border rounded-md relative">
                <Button 
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={() => removeTask(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
                
                <div className="space-y-2">
                  <Label>Task Title</Label>
                  <Input
                    {...register(`tasks.${index}.title`)}
                    placeholder="Task title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    {...register(`tasks.${index}.description`)}
                    placeholder="Task description"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      onValueChange={(value) => setValue(`tasks.${index}.priority`, value)}
                      value={watch(`tasks.${index}.priority`)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Deadline</Label>
                    <Input
                      type="date"
                      {...register(`tasks.${index}.deadline`)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
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
