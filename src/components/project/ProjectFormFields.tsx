
import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Project } from '@/types';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { FormValues } from '../CreateProjectDialog';

interface ProjectFormFieldsProps {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  editingProject?: Project;
}

const ProjectFormFields: React.FC<ProjectFormFieldsProps> = ({
  register,
  errors,
  editingProject,
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
          <p className="text-xs text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Project description"
          className="min-h-[100px]"
          {...register('description')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date <span className="text-red-500">*</span></Label>
          <Input
            id="startDate"
            type="date"
            {...register('startDate', { required: 'Start date is required' })}
          />
          {errors.startDate && (
            <p className="text-xs text-red-500">{errors.startDate.message}</p>
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
            <p className="text-xs text-red-500">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget">Budget</Label>
        <Input
          id="budget"
          type="number"
          placeholder="Project budget (optional)"
          {...register('budget')}
        />
      </div>
    </>
  );
};

export default ProjectFormFields;
