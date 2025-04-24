
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useProjects } from '@/hooks/useProjects';
import ProjectCard from '@/components/ProjectCard';
import CreateProjectDialog from '@/components/CreateProjectDialog';

const ProjectsPage = () => {
  const { projects, isLoading } = useProjects();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (isLoading) {
    return <div className="flex items-center justify-center h-32">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
        
        {projects.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 p-8 text-center border rounded-lg bg-white dark:bg-card">
            <p className="text-gray-500 mb-4">No projects found</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create First Project
            </Button>
          </div>
        )}
      </div>

      <CreateProjectDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
    </div>
  );
};

export default ProjectsPage;
