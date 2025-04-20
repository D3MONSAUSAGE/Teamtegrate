
import { Project } from '@/types';

export const addTeamMemberToProject = async (
  projectId: string,
  userId: string,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  setProjects(prevProjects => prevProjects.map(project => {
    if (project.id === projectId) {
      return {
        ...project,
        teamMembers: [...(project.teamMembers || []), userId]
      };
    }
    return project;
  }));
};

export const removeTeamMemberFromProject = async (
  projectId: string,
  userId: string,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  setProjects(prevProjects => prevProjects.map(project => {
    if (project.id === projectId) {
      return {
        ...project,
        teamMembers: (project.teamMembers || []).filter(id => id !== userId)
      };
    }
    return project;
  }));
};
