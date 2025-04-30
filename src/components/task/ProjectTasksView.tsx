
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import CreateTaskDialog from '../CreateTaskDialog';
import ProjectOverview from './project-view/ProjectOverview';
import ProjectTasksFilters from './project-view/ProjectTasksFilters';
import TaskTabs from './TaskTabs';
import { useProjectTasks } from './project-view/useProjectTasks';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const ProjectTasksView = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const { tasks, projects, refreshProjects } = useTask();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Fetch fresh data when the component mounts or projectId changes
  useEffect(() => {
    const loadData = async () => {
      if (!projectId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      
      try {
        console.log(`Loading projects data for project ID: ${projectId}`);
        await refreshProjects();
        console.log(`Successfully loaded projects data for project ID: ${projectId}`);
      } catch (error) {
        console.error('Error refreshing project data:', error);
        setLoadError('Failed to load project data. Please try refreshing.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [projectId, refreshProjects]);
  
  // Get project details
  const project = projects.find(p => p.id === projectId);
  
  // Use custom hook for task filtering and sorting
  const {
    searchQuery, 
    setSearchQuery,
    sortBy,
    setSortBy,
    todoTasks,
    inProgressTasks,
    pendingTasks,
    completedTasks,
    progress,
    projectTasks
  } = useProjectTasks(tasks, projectId);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  };

  const handleCreateTask = () => {
    setEditingTask(undefined);
    setIsCreateTaskOpen(true);
  };
  
  const handleManualRefresh = async () => {
    if (!projectId) return;
    
    setIsRefreshing(true);
    setLoadError(null);
    
    try {
      await refreshProjects();
      toast.success("Project data refreshed successfully");
    } catch (error) {
      console.error('Error refreshing project data:', error);
      setLoadError('Failed to refresh project data.');
      toast.error("Failed to refresh project data");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-pulse text-lg">Loading project tasks...</div>
        </div>
      </div>
    );
  }
  
  if (loadError) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-red-500">{loadError}</p>
          <Button 
            onClick={handleManualRefresh} 
            disabled={isRefreshing}
            className="flex items-center"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? "Refreshing..." : "Refresh Project Data"}
          </Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-lg">Project not found or not accessible.</p>
          <Button 
            onClick={handleManualRefresh} 
            disabled={isRefreshing}
            className="flex items-center"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? "Refreshing..." : "Refresh Project Data"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <ProjectOverview
          project={project}
          progress={progress}
          todoTasksLength={todoTasks.length}
          inProgressTasksLength={inProgressTasks.length}
          pendingTasksLength={pendingTasks.length}
          completedTasksLength={completedTasks.length}
          onCreateTask={handleCreateTask}
        />
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1">
          <ProjectTasksFilters
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            sortBy={sortBy}
            onSortByChange={setSortBy}
          />
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="ml-2 whitespace-nowrap"
        >
          <RefreshCw className={`mr-1 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
      
      <TaskTabs
        todoTasks={todoTasks}
        inProgressTasks={inProgressTasks}
        pendingTasks={pendingTasks}
        completedTasks={completedTasks}
        onEdit={handleEditTask}
        onNewTask={handleCreateTask}
      />
      
      <CreateTaskDialog
        open={isCreateTaskOpen} 
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        currentProjectId={projectId ?? undefined}
      />
    </div>
  );
};

export default ProjectTasksView;
