
import React from 'react';
import { Button } from "@/components/ui/button";
import { Project } from '@/types';
import { Plus, ChevronRight, FolderKanban } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20">
            <FolderKanban className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-foreground to-blue-600 bg-clip-text text-transparent">
            My Projects
          </h2>
        </div>
        <Link to="/dashboard/projects">
          <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-500/10 transition-colors">
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
      
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {projects.slice(0, isMobile ? 1 : 3).map((project) => (
            <div key={project.id} className="group transition-all duration-300 hover:scale-[1.02]">
              <ProjectCard 
                project={project} 
                onViewTasks={() => onViewTasks(project)} 
                onCreateTask={() => onCreateTask(project)}
                onDeleted={onRefresh}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card border shadow-lg bg-gradient-to-br from-white/90 via-white/85 to-white/80 dark:from-card/90 dark:via-card/85 dark:to-card/80 backdrop-blur-xl rounded-2xl p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-gradient-to-r from-muted/50 to-muted/30">
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-card-foreground">No accessible projects</h3>
              <p className="text-muted-foreground text-sm">
                You don't have access to any projects yet. Contact your manager or admin to be added to projects, or create your own if you have permission.
              </p>
            </div>
            <Link to="/dashboard/projects">
              <Button variant="outline" size={isMobile ? "sm" : "default"} className="mt-2 hover:bg-blue-500/10 hover:border-blue-500 transition-colors">
                <Plus className="h-4 w-4 mr-2" /> Explore Projects
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentProjects;
