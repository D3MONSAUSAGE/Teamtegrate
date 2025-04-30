
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

const ProjectTasksView = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const { tasks, projects, refreshProjects } = useTask();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch fresh data when the component mounts or projectId changes
  useEffect(() => {
    const loadData = async () => {
      if (projectId) {
        setIsLoading(true);
        try {
          await refreshProjects();
        } catch (error) {
          console.error('Error refreshing project data:', error);
          toast.error('Failed to load project data');
        } finally {
          setIsLoading(false);
        }
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
    progress
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

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-pulse text-lg">Loading project tasks...</div>
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
      
      <ProjectTasksFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />
      
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
