
import React from 'react';
import { Button } from "@/components/ui/button";
import { Project } from '@/types';
import { Plus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProjectCard from '@/components/project-card';
import { useIsMobile } from '@/hooks/use-mobile';

interface RecentProjectsProps {
  projects: Project[];
  onViewTasks: (project: Project) => void;
  onCreateTask: (project: Project) => void;
  onRefresh: () => void;
}

const RecentProjects: React.FC<RecentProjectsProps> = ({
  projects,
  onViewTasks,
  onCreateTask,
  onRefresh
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div>
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-lg md:text-xl font-semibold">Recent Projects</h2>
        <Link to="/dashboard/projects">
          <Button variant="ghost" size="sm" className="text-primary">
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
      
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {projects.slice(0, isMobile ? 1 : 3).map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onViewTasks={() => onViewTasks(project)} 
              onCreateTask={() => onCreateTask(project)}
              onDeleted={onRefresh}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-card p-4 md:p-6 rounded-lg border text-center">
          <p className="text-gray-500 dark:text-gray-300 text-sm md:text-base">No projects created yet</p>
          <Link to="/dashboard/projects">
            <Button variant="outline" size={isMobile ? "sm" : "default"} className="mt-2">
              <Plus className="h-4 w-4 mr-2" /> Create Project
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecentProjects;
