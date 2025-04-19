
import React, { useState, useEffect, useCallback } from 'react';
import { useTask } from '@/contexts/task';
import { Project, Task } from '@/types';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import AssignTaskDialog from '@/components/AssignTaskDialog';
import ProjectToolbar from '@/components/ProjectToolbar';
import ProjectList from '@/components/ProjectList';
import ProjectTasksDialog from '@/components/ProjectTasksDialog';
import { toast } from '@/components/ui/sonner';
import { Loader2 } from 'lucide-react';

const ProjectsPage = () => {
  const { projects, fetchProjects, isLoading } = useTask();
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isViewTasksOpen, setIsViewTasksOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch projects only once when the component mounts
  useEffect(() => {
    if (fetchProjects) {
      console.log("Fetching projects on page load");
      setPageLoading(true);
      setError(null);
      
      fetchProjects()
        .then(() => {
          setPageLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching projects:", err);
          setError("Failed to load projects. Please try refreshing the page.");
          setPageLoading(false);
        });
    }
  }, [fetchProjects]);
  
  // Memoize handlers to prevent unnecessary re-renders
  const handleEditProject = useCallback((project: Project) => {
    setEditingProject(project);
    setIsCreateProjectOpen(true);
  }, []);
  
  const handleViewTasks = useCallback((project: Project) => {
    setSelectedProject(project);
    setIsViewTasksOpen(true);
  }, []);
  
  const handleCreateTask = useCallback((project?: Project) => {
    setEditingTask(undefined);
    setSelectedProject(project || null);
    setIsCreateTaskOpen(true);
  }, []);
  
  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  }, []);
  
  const handleAssignTask = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsAssignTaskOpen(true);
  }, []);

  const handleCreateProject = useCallback(() => {
    setEditingProject(undefined);
    setIsCreateProjectOpen(true);
  }, []);
  
  // Handle dialog closings with refresh functions
  const handleTaskDialogChange = useCallback((open: boolean) => {
    setIsCreateTaskOpen(open);
    if (!open && fetchProjects) {
      console.log("Refreshing projects after task dialog closed");
      // Refresh projects data when task dialog closes
      fetchProjects().catch(err => {
        console.error("Error refreshing projects:", err);
        toast.error("Failed to refresh project data");
      });
    }
  }, [fetchProjects]);
  
  const handleViewTasksDialogChange = useCallback((open: boolean) => {
    setIsViewTasksOpen(open);
  }, []);
  
  const handleProjectDialogChange = useCallback((open: boolean) => {
    setIsCreateProjectOpen(open);
    if (!open && fetchProjects) {
      console.log("Refreshing projects after project dialog closed");
      // Refresh projects data when project dialog closes
      fetchProjects().catch(err => {
        console.error("Error refreshing projects:", err);
        toast.error("Failed to refresh project data");
      });
    }
  }, [fetchProjects]);
  
  // Filter & sort projects
  const filteredProjects = projects.filter((project) => {
    return (
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'start':
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      case 'end':
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
  
  // Loading state
  if (pageLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Loading projects...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => {
              setPageLoading(true);
              setError(null);
              fetchProjects()
                .then(() => setPageLoading(false))
                .catch(err => {
                  console.error("Error retrying fetch:", err);
                  setError("Failed to load projects. Please try again later.");
                  setPageLoading(false);
                });
            }}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <ProjectToolbar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onCreateProject={handleCreateProject}
      />
      
      <ProjectList 
        projects={sortedProjects}
        searchQuery={searchQuery}
        onEditProject={handleEditProject}
        onViewTasks={handleViewTasks}
        onCreateProject={handleCreateProject}
        onCreateTask={handleCreateTask}
      />
      
      <CreateProjectDialog 
        open={isCreateProjectOpen} 
        onOpenChange={handleProjectDialogChange}
        editingProject={editingProject}
      />
      
      <ProjectTasksDialog 
        open={isViewTasksOpen}
        onOpenChange={handleViewTasksDialogChange}
        project={selectedProject}
        onCreateTask={() => handleCreateTask(selectedProject)}
        onEditTask={handleEditTask}
        onAssignTask={handleAssignTask}
      />
      
      <CreateTaskDialog 
        open={isCreateTaskOpen} 
        onOpenChange={handleTaskDialogChange}
        editingTask={editingTask}
        currentProjectId={selectedProject?.id}
      />
      
      {selectedTask && (
        <AssignTaskDialog 
          open={isAssignTaskOpen} 
          onOpenChange={setIsAssignTaskOpen}
          task={selectedTask}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
