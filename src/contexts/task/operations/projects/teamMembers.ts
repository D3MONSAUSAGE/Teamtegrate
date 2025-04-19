
import { Project } from '@/types';
import { toast } from '@/components/ui/sonner';

export const addTeamMemberToProject = (
  projectId: string,
  userId: string,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  const updatedProjects = projects.map((project) => {
    if (project.id === projectId) {
      const teamMembers = project.teamMembers || [];
      if (!teamMembers.includes(userId)) {
        return { 
          ...project, 
          teamMembers: [...teamMembers, userId],
          updatedAt: new Date() 
        };
      }
    }
    return project;
  });

  setProjects(updatedProjects);
  toast.success('Team member added to project successfully!');
};

export const removeTeamMemberFromProject = (
  projectId: string,
  userId: string,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  const updatedProjects = projects.map((project) => {
    if (project.id === projectId && project.teamMembers) {
      return { 
        ...project, 
        teamMembers: project.teamMembers.filter(id => id !== userId),
        updatedAt: new Date() 
      };
    }
    return project;
  });

  setProjects(updatedProjects);
  toast.success('Team member removed from project successfully!');
};
