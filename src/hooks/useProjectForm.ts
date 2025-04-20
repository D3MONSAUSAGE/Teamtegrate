
import { useState } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { Project } from '@/types';
import { format } from 'date-fns';
import { FormValues } from '@/components/project/ProjectFormTypes';

export const useProjectForm = (editingProject?: Project) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue, control, watch } = useForm<FormValues>({
    defaultValues: {
      title: editingProject?.title || '',
      description: editingProject?.description || '',
      startDate: editingProject ? format(new Date(editingProject.startDate), 'yyyy-MM-dd') : '',
      endDate: editingProject ? format(new Date(editingProject.endDate), 'yyyy-MM-dd') : '',
      budget: editingProject?.budget || '',
      teamMembers: editingProject?.teamMembers?.map((id) => ({ memberId: id })) || [],
      tasks: []
    }
  });

  const teamMemberArray = useFieldArray({
    control,
    name: "teamMembers"
  });

  const taskArray = useFieldArray({
    control,
    name: "tasks"
  });

  return {
    register,
    handleSubmit,
    errors,
    reset,
    setValue,
    control,
    watch,
    teamMemberArray,
    taskArray
  };
};
