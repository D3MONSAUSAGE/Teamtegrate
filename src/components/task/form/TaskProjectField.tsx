
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
  
  // Superadmins and admins can see all projects, others see only projects they have access to
  const accessibleProjects = React.useMemo(() => {
    if (!user) return [];
    
    console.log('TaskProjectField: Filtering projects for user:', {
      userId: user.id,
      userRole: user.role,
      totalProjects: projects.length,
      projectTitles: projects.map(p => p.title)
    });
    
    // Superadmins and admins can access all projects in their organization
    if (user.role === 'superadmin' || user.role === 'admin') {
      console.log('TaskProjectField: User is superadmin/admin, showing all projects:', projects.length);
      return projects;
    }
    
    // For other users, filter based on management or team membership
    const filtered = projects.filter(project => {
      const isManager = project.managerId === user.id;
      const isTeamMember = Array.isArray(project.teamMemberIds) && 
        project.teamMemberIds.includes(user.id);
      
      return isManager || isTeamMember;
    });
    
    console.log('TaskProjectField: Filtered projects for non-admin user:', {
      filteredCount: filtered.length,
      filteredTitles: filtered.map(p => p.title)
    });
    
    return filtered;
  }, [projects, user]);

  return (
    <div>
      <Label htmlFor="projectId">Project</Label>
      <Select 
        defaultValue={editingTask?.projectId || currentProjectId || "none"}
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
      {accessibleProjects.length === 0 && user?.role !== 'superadmin' && user?.role !== 'admin' && (
        <p className="text-sm text-muted-foreground mt-1">
          No projects available. You need to be assigned to a project or create one first.
        </p>
      )}
    </div>
  );
};
