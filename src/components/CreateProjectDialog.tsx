import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { Project } from '@/types';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProject?: Project;
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ open, onOpenChange, editingProject }) => {
  const { user } = useAuth();
  const { addProject, updateProject } = useTask();
  const isEditMode = !!editingProject;
  
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    defaultValues: {
      title: editingProject?.title || '',
      description: editingProject?.description || '',
      startDate: editingProject ? format(new Date(editingProject.startDate), 'yyyy-MM-dd') : '',
      endDate: editingProject ? format(new Date(editingProject.endDate), 'yyyy-MM-dd') : '',
      budget: editingProject?.budget || '',
    },
  });
  
  React.useEffect(() => {
    if (editingProject) {
      setValue('title', editingProject.title);
      setValue('description', editingProject.description);
      setValue('startDate', format(new Date(editingProject.startDate), 'yyyy-MM-dd'));
      setValue('endDate', format(new Date(editingProject.endDate), 'yyyy-MM-dd'));
      setValue('budget', editingProject.budget);
    } else {
      reset();
    }
  }, [editingProject, setValue, reset]);
  
  const onSubmit = (data: any) => {
    if (!user) return;
    
    const projectData = {
      ...data,
      budget: data.budget ? parseFloat(data.budget) : undefined,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      managerId: user.id,
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
      <DialogContent className="sm:max-w-[500px]">
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
              <span className="text-xs text-red-500">{errors.title.message}</span>
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
                <span className="text-xs text-red-500">{errors.startDate.message}</span>
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
                <span className="text-xs text-red-500">{errors.endDate.message}</span>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="budget">Budget (Optional)</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              placeholder="Enter project budget"
              {...register('budget', { 
                setValueAs: (v) => v === '' ? undefined : parseFloat(v),
                validate: (v) => v === undefined || v >= 0 || 'Budget must be non-negative'
              })}
            />
            {errors.budget && (
              <span className="text-xs text-red-500">{errors.budget.message}</span>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => {
              onOpenChange(false);
              reset();
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

export default CreateProjectDialog;
