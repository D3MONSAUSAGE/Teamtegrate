
import React from 'react';
import { Project, Task, TaskStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import ProjectOverview from './ProjectOverview';
import ProjectTasksFilters from './ProjectTasksFilters';
import TaskTabs from '../TaskTabs';

interface ProjectTasksContentProps {
  project: Project;
  progress: number;
  todoTasks: Task[];
  inProgressTasks: Task[];
  pendingTasks: Task[];
  completedTasks: Task[];
  searchQuery: string;
  sortBy: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSortByChange: (value: string) => void;
  onRefresh: () => Promise<void>;
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
  onTaskStatusChange,
}) => {
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
          onCreateTask={onCreateTask}
        />
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1">
          <ProjectTasksFilters
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            sortBy={sortBy}
            onSortByChange={onSortByChange}
          />
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
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
        onEdit={onEditTask}
        onNewTask={onCreateTask}
        onStatusChange={onTaskStatusChange}
      />
    </div>
  );
};

export default ProjectTasksContent;
