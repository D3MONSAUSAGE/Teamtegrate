
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Project, Task, TaskPriority } from '@/types';
import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";

interface TaskDetailsSectionProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  projects: Project[];
  editingTask?: Task;
  currentProjectId?: string;
  setValue: UseFormSetValue<any>;
}

export const TaskDetailsSection: React.FC<TaskDetailsSectionProps> = ({
  register,
  errors,
  projects,
  editingTask,
  currentProjectId,
  setValue
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Task title"
          {...register("title", { required: "Title is required" })}
          className="w-full"
        />
        {errors.title && (
          <p className="text-red-500 text-xs mt-1">{errors.title.message as string}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Task description"
          {...register("description")}
          className="w-full min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select 
            defaultValue={editingTask?.priority || "Medium"}
            onValueChange={(value) => setValue('priority', value as TaskPriority)}
          >
            <SelectTrigger className="w-full">
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
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            type="date"
            {...register("deadline")}
            className="w-full"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectId">Project</Label>
        <Select 
          defaultValue={currentProjectId || editingTask?.projectId || "none"}
          onValueChange={(value) => setValue('projectId', value)}
          disabled={!!currentProjectId}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Project</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="cost">Cost</Label>
        <Input
          id="cost"
          type="number"
          step="0.01"
          min="0"
          placeholder="Enter cost (optional)"
          {...register("cost")}
          className="w-full"
        />
      </div>
    </div>
  );
};
