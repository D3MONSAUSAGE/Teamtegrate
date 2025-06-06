
import React, { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2 } from 'lucide-react';
import ProjectCard from '@/components/project-card';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import CreateSheltonLawProjectButton from '@/components/CreateSheltonLawProjectButton';
import { useNavigate } from 'react-router-dom';

const ProjectsPage = () => {
  const { user } = useAuth();
  const { projects, isLoading, refreshProjects } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const navigate = useNavigate();

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewTasks = (projectId: string) => {
    navigate(`/dashboard/projects/${projectId}/tasks`);
  };

  const handleCreateTask = (projectId: string) => {
    navigate(`/dashboard/projects/${projectId}/tasks`);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Projects</h1>
          <div className="flex gap-2">
            <CreateSheltonLawProjectButton />
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
        
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onViewTasks={() => handleViewTasks(project.id)}
              onCreateTask={() => handleCreateTask(project.id)}
              onDeleted={refreshProjects}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {searchQuery ? 'No projects found matching your search.' : 'No projects yet.'}
          </div>
          {!searchQuery && (
            <div className="flex gap-2 justify-center">
              <CreateSheltonLawProjectButton />
              <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </div>
          )}
        </div>
      )}

      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={refreshProjects}
      />
    </div>
  );
};

export default ProjectsPage;
