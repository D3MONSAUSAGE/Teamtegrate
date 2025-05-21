
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTask } from '@/contexts/task';
import { Task } from '@/types';

interface TaskProjectFieldProps {
  register: any;
  errors: any;
  editingTask?: Task;
  currentProjectId?: string;
}

export const TaskProjectField: React.FC<TaskProjectFieldProps> = ({
  register,
  errors,
  editingTask,
  currentProjectId
}) => {
  const { projects } = useTask();
  
  return (
    <div>
      <Label htmlFor="projectId">Project</Label>
      <Select 
        defaultValue={editingTask?.projectId || currentProjectId || "none"}
        onValueChange={(value) => {
          register("projectId").onChange({ target: { name: "projectId", value } });
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="none">Unassigned</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <input
        type="hidden"
        {...register("projectId")}
      />
    </div>
  );
};
