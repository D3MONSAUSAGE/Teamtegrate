
import { useState, useCallback, useEffect } from 'react';
import { Project, Task } from '@/types';
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';

export const useProjectsPage = () => {
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

  // Initial data fetch
  useEffect(() => {
    if (fetchProjects) {
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

  // Handlers
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

  // Dialog handlers with refresh
  const handleTaskDialogChange = useCallback((open: boolean) => {
    setIsCreateTaskOpen(open);
    if (!open && fetchProjects) {
      console.log("Refreshing projects after task dialog closed");
      fetchProjects().catch(err => {
        console.error("Error refreshing projects:", err);
        toast.error("Failed to refresh project data");
      });
    }
  }, [fetchProjects]);
  
  const handleProjectDialogChange = useCallback((open: boolean) => {
    setIsCreateProjectOpen(open);
    if (!open && fetchProjects) {
      console.log("Refreshing projects after project dialog closed");
      fetchProjects().catch(err => {
        console.error("Error refreshing projects:", err);
        toast.error("Failed to refresh project data");
      });
    }
  }, [fetchProjects]);

  // Sort and filter projects
  const sortedProjects = [...projects].sort((a, b) => {
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

  return {
    sortedProjects,
    pageLoading,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    isCreateProjectOpen,
    editingProject,
    selectedProject,
    isViewTasksOpen,
    isCreateTaskOpen,
    editingTask,
    selectedTask,
    isAssignTaskOpen,
    handleEditProject,
    handleViewTasks,
    handleCreateTask,
    handleEditTask,
    handleAssignTask,
    handleCreateProject,
    handleTaskDialogChange,
    handleProjectDialogChange,
    setIsViewTasksOpen,
    setIsAssignTaskOpen,
  };
};
