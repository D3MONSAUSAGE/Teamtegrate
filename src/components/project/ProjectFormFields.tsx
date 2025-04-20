
import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Project } from '@/types';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface ProjectFormFieldsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  editingProject?: Project;
}

const ProjectFormFields: React.FC<ProjectFormFieldsProps> = ({
  register,
  errors,
  editingProject
}) => {
  return (
    <>
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
    </>
  );
};

export default ProjectFormFields;
