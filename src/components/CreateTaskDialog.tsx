
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Task, TaskPriority, TaskStatus } from '@/types';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Users } from 'lucide-react';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: Task;
  currentProjectId?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role?: string;
  managerId?: string;
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({ 
  open, 
  onOpenChange, 
  editingTask,
  currentProjectId 
}) => {
  const { user } = useAuth();
  const { addTask, updateTask, projects } = useTask();
  const isEditMode = !!editingTask;
  const [selectedMember, setSelectedMember] = useState<string | undefined>(
    editingTask?.assignedToId
  );
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  // Load team members from localStorage on mount
  useEffect(() => {
    const storedMembers = localStorage.getItem('teamMembers');
    if (storedMembers) {
      setTeamMembers(JSON.parse(storedMembers));
    }
  }, []);
  
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    defaultValues: {
      title: editingTask?.title || '',
      description: editingTask?.description || '',
      priority: editingTask?.priority || 'Medium' as TaskPriority,
      deadline: editingTask ? format(new Date(editingTask.deadline), "yyyy-MM-dd'T'HH:mm") : '',
      projectId: editingTask?.projectId || currentProjectId || '',
    },
  });
  
  React.useEffect(() => {
    if (editingTask) {
      setValue('title', editingTask.title);
      setValue('description', editingTask.description);
      setValue('priority', editingTask.priority);
      setValue('deadline', format(new Date(editingTask.deadline), "yyyy-MM-dd'T'HH:mm"));
      setValue('projectId', editingTask.projectId || '');
      setSelectedMember(editingTask.assignedToId);
    } else {
      if (currentProjectId) {
        setValue('projectId', currentProjectId);
      }
      reset();
    }
  }, [editingTask, currentProjectId, setValue, reset]);
  
  const onSubmit = (data: any) => {
    if (isEditMode && editingTask) {
      updateTask(editingTask.id, {
        ...data,
        deadline: new Date(data.deadline),
        assignedToId: selectedMember,
        assignedToName: selectedMember ? 
          teamMembers.find(m => m.id === selectedMember)?.name : undefined
      });
    } else {
      addTask({
        title: data.title,
        description: data.description,
        priority: data.priority as TaskPriority,
        deadline: new Date(data.deadline),
        status: 'To Do' as TaskStatus,
        userId: user?.id || '',
        projectId: data.projectId || undefined,
        assignedToId: selectedMember,
        assignedToName: selectedMember ? 
          teamMembers.find(m => m.id === selectedMember)?.name : undefined
      });
    }
    onOpenChange(false);
    reset();
    setSelectedMember(undefined);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              placeholder="Task title"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && (
              <span className="text-xs text-red-500">{errors.title.message}</span>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Task description"
              {...register('description')}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="projectId">Project</Label>
            <Select
              defaultValue={editingTask?.projectId || currentProjectId || ''}
              onValueChange={(value) => setValue('projectId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Project</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assigned To</Label>
            <Select
              value={selectedMember}
              onValueChange={setSelectedMember}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assign to team member (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers.length > 0 ? (
                  teamMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-members" disabled>
                    No team members added yet
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priority">Priority <span className="text-red-500">*</span></Label>
            <Select
              defaultValue={editingTask?.priority || 'Medium'}
              onValueChange={(value) => setValue('priority', value as TaskPriority)}
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
            <Label htmlFor="deadline">Deadline <span className="text-red-500">*</span></Label>
            <Input
              id="deadline"
              type="datetime-local"
              {...register('deadline', { required: 'Deadline is required' })}
            />
            {errors.deadline && (
              <span className="text-xs text-red-500">{errors.deadline.message}</span>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => {
              onOpenChange(false);
              reset();
              setSelectedMember(undefined);
            }}>
              Cancel
            </Button>
            <Button type="submit">{isEditMode ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
