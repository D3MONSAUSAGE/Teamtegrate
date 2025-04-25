
import React from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Project } from '@/types';

interface TaskProjectFieldProps {
  projects: Project[];
  currentProjectId?: string;
  editingTask?: any;
  setValue: (name: string, value: any) => void;
}

const TaskProjectField: React.FC<TaskProjectFieldProps> = ({
  projects,
  currentProjectId,
  editingTask,
  setValue
}) => {
  return (
    <div className="space-y-1">
      <Label htmlFor="project">Project</Label>
      <Select 
        defaultValue={currentProjectId || editingTask?.projectId || "none"} 
        onValueChange={(value) => setValue('projectId', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select project" />
        </SelectTrigger>
        <SelectContent position="popper" className="w-[200px]">
          <SelectItem value="none">No Project</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TaskProjectField;
