
import React, { useEffect } from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Project } from '@/types';
import { useTask } from '@/contexts/task';

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
  const { refreshProjects } = useTask();
  const [isSelectOpen, setIsSelectOpen] = React.useState(false);
  
  // Refresh projects when the select dropdown is opened
  useEffect(() => {
    if (isSelectOpen) {
      console.log('TaskProjectField: Dropdown opened, refreshing projects');
      refreshProjects();
    }
  }, [isSelectOpen, refreshProjects]);
  
  const handleOpenChange = (open: boolean) => {
    setIsSelectOpen(open);
  };

  // Log available projects for debugging
  useEffect(() => {
    console.log('TaskProjectField: Available projects:', projects.map(p => ({ id: p.id, title: p.title })));
  }, [projects]);

  return (
    <div className="space-y-1">
      <Label htmlFor="project">Project</Label>
      <Select 
        defaultValue={currentProjectId || editingTask?.projectId || "none"} 
        onValueChange={(value) => setValue('projectId', value)}
        onOpenChange={handleOpenChange}
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
