
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Project } from '@/types';
import { UseFormReturn } from 'react-hook-form';

interface TaskProjectSelectProps {
  form: UseFormReturn<any>;
  projects: Project[];
  currentProjectId?: string;
}

const TaskProjectSelect: React.FC<TaskProjectSelectProps> = ({ 
  form, 
  projects, 
  currentProjectId 
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">Project</Label>
      <Select 
        defaultValue={currentProjectId || "none"}
        onValueChange={(value) => form.setValue('projectId', value)}
        disabled={!!currentProjectId}
      >
        <SelectTrigger className="h-12 border-2 focus:border-primary">
          <SelectValue />
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
  );
};

export default TaskProjectSelect;
