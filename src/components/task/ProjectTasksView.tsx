
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import CreateTaskDialog from '../CreateTaskDialog';
import ProjectOverview from './project-view/ProjectOverview';
import ProjectTasksFilters from './project-view/ProjectTasksFilters';
import TaskTabs from './TaskTabs';
import { useProjectTasks } from './project-view/useProjectTasks';

const ProjectTasksView = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const { tasks, projects } = useTask();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  
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
