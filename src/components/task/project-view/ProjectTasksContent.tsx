
import React from 'react';
import { Project, Task, TaskStatus } from '@/types';
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from 'lucide-react';
import ProjectOverview from './ProjectOverview';
import ProjectTasksFilters from './ProjectTasksFilters';
import TaskList from '@/components/task/TaskList';

interface ProjectTasksContentProps {
  project: Project;
  progress: number;
  todoTasks: Task[];
  inProgressTasks: Task[];
  pendingTasks: Task[];
  completedTasks: Task[];
  searchQuery: string;
  sortBy: string;
  onSearchChange: (query: string) => void;
  onSortByChange: (sortBy: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onEditTask: (task: Task) => void;
  onCreateTask: () => void;
  onTaskStatusChange: (taskId: string, status: TaskStatus) => void;
}

const ProjectTasksContent: React.FC<ProjectTasksContentProps> = ({
  project,
  progress,
  todoTasks,
  inProgressTasks,
  pendingTasks,
  completedTasks,
  searchQuery,
  sortBy,
  onSearchChange,
  onSortByChange,
  onRefresh,
  isRefreshing,
  onEditTask,
  onCreateTask,
  onTaskStatusChange
}) => {
  const allTasks = [...todoTasks, ...inProgressTasks, ...pendingTasks, ...completedTasks];

  return (
    <div className="space-y-6">
      {/* Project Overview */}
      <ProjectOverview
        project={project}
        progress={progress}
        todoTasksCount={todoTasks.length}
        inProgressTasksCount={inProgressTasks.length}
        pendingTasksCount={pendingTasks.length}
        completedTasksCount={completedTasks.length}
        onCreateTask={onCreateTask}
      />

      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Tasks</h2>
          <p className="text-muted-foreground">
            {allTasks.length} total tasks
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={onCreateTask} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ProjectTasksFilters
        searchQuery={searchQuery}
        sortBy={sortBy}
        onSearchChange={onSearchChange}
        onSortByChange={onSortByChange}
      />

      {/* Task Lists */}
      <div className="space-y-8">
        <TaskList
          title="To Do"
          tasks={todoTasks}
          onEdit={onEditTask}
          onStatusChange={onTaskStatusChange}
          showAddButton={true}
          onAddTask={onCreateTask}
        />
        
        <TaskList
          title="In Progress"
          tasks={inProgressTasks}
          onEdit={onEditTask}
          onStatusChange={onTaskStatusChange}
        />
        
        <TaskList
          title="Pending"
          tasks={pendingTasks}
          onEdit={onEditTask}
          onStatusChange={onTaskStatusChange}
        />
        
        <TaskList
          title="Completed"
          tasks={completedTasks}
          onEdit={onEditTask}
          onStatusChange={onTaskStatusChange}
        />
      </div>
    </div>
  );
};

export default ProjectTasksContent;
