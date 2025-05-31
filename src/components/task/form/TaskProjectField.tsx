
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Project, Task } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface TaskProjectFieldProps {
  register: any;
  errors: any;
  editingTask?: Task;
  currentProjectId?: string;
  projects: Project[];
  setValue: any;
}

export const TaskProjectField: React.FC<TaskProjectFieldProps> = ({
  register,
  errors,
  editingTask,
  currentProjectId,
  projects,
  setValue
}) => {
  const { user } = useAuth();
  
  // Filter projects to only show those the user has access to
  const accessibleProjects = projects.filter(project => {
    if (!user) return false;
    
    const isManager = project.manager_id === user.id;
    const isTeamMember = Array.isArray(project.team_members) && 
      project.team_members.includes(user.id);
    
    return isManager || isTeamMember;
  });

  return (
    <div>
      <Label htmlFor="projectId">Project</Label>
      <Select 
        defaultValue={editingTask?.project_id || currentProjectId || "none"}
        onValueChange={(value) => {
          setValue("projectId", value);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="none">Unassigned</SelectItem>
            {accessibleProjects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
