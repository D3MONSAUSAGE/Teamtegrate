
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useProjects } from '@/hooks/useProjects';
import ProjectCard from '@/components/ProjectCard';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import CreateTaskDialogWithAI from '@/components/CreateTaskDialogWithAI';

const ProjectsPage = () => {
  const { projects, isLoading, refreshProjects } = useProjects();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  // Add effect to detect and handle loading errors
  useEffect(() => {
    const handleRefresh = async () => {
      try {
        await refreshProjects();
      } catch (error) {
        console.error("Error refreshing projects:", error);
        toast.error("Failed to load projects. Please try again.");
      }
    };
    
    if (projects.length === 0 && !isLoading) {
      handleRefresh();
    }
  }, [projects.length, isLoading]);

  const handleViewTasks = (projectId: string) => {
    navigate(`/dashboard/tasks?projectId=${projectId}`);
  };

  const handleCreateTask = (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowCreateTaskDialog(true);
  };

  const handleCreateSuccess = () => {
    refreshProjects();
    toast.success("Project created successfully!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse text-lg">Loading projects...</div>
      </div>
    );
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
          <ProjectCard 
            key={project.id} 
            project={project}
            onViewTasks={() => handleViewTasks(project.id)}
            onCreateTask={() => handleCreateTask(project.id)}
          />
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
        onSuccess={handleCreateSuccess}
      />

      <CreateTaskDialogWithAI
        open={showCreateTaskDialog}
        onOpenChange={setShowCreateTaskDialog}
        editingTask={undefined}
        currentProjectId={selectedProjectId}
      />
    </div>
  );
};

export default ProjectsPage;
