
import React from 'react';
import { Button } from "@/components/ui/button";
import { Project } from '@/types';
import { Plus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProjectCard from '@/components/ProjectCard';

interface RecentProjectsProps {
  projects: Project[];
  onViewTasks: (project: Project) => void;
  onCreateTask: (project: Project) => void;
}

const RecentProjects: React.FC<RecentProjectsProps> = ({
  projects,
  onViewTasks,
  onCreateTask
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Recent Projects</h2>
        <Link to="/dashboard/projects">
          <Button variant="ghost" size="sm" className="text-primary">
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
      
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onViewTasks={() => onViewTasks(project)} 
              onCreateTask={() => onCreateTask(project)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg border text-center">
          <p className="text-gray-500">No projects created yet</p>
          <Link to="/dashboard/projects">
            <Button variant="outline" size="sm" className="mt-2">
              <Plus className="h-4 w-4 mr-2" /> Create Project
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecentProjects;
