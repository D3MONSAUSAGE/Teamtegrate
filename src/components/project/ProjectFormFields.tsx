
import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Project } from '@/types';

export type FormValues = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: string | number;
  teamMembers: { memberId: string }[];
  tasks: { title: string; description: string; priority: string; deadline: string }[];
}

interface ProjectFormFieldsProps {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
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
        <Label htmlFor="title">Project Title <span className="text-red-500">*</span></Label>
        <Input
          id="title"
          placeholder="Enter project title"
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
          placeholder="Enter project description"
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
          placeholder="Enter project budget"
          {...register('budget')}
        />
      </div>
    </>
  );
};

export default ProjectFormFields;
