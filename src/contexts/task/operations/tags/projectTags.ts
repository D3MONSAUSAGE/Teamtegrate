
import { Project } from '@/types';
import { toast } from '@/components/ui/sonner';

export const addTagToProject = (
  projectId: string,
  tag: string,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  const updatedProjects = projects.map((project) => {
    if (project.id === projectId) {
      const tags = project.tags || [];
      if (!tags.includes(tag)) {
        return { 
          ...project, 
          tags: [...tags, tag],
          updatedAt: new Date() 
        };
      }
    }
    return project;
  });

  setProjects(updatedProjects);
  toast.success('Tag added to project successfully!');
};

export const removeTagFromProject = (
  projectId: string,
  tag: string,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  const updatedProjects = projects.map((project) => {
    if (project.id === projectId && project.tags) {
      return { 
        ...project, 
        tags: project.tags.filter(t => t !== tag),
        updatedAt: new Date() 
      };
    }
    return project;
  });

  setProjects(updatedProjects);
  toast.success('Tag removed from project successfully!');
};
