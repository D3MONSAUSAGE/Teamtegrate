
import React from 'react';
import { Project, Task, TaskStatus, User } from '@/types';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import ProjectOverview from './ProjectOverview';
import ProjectTasksFilters from './ProjectTasksFilters';
import ProjectTasksTabs from './ProjectTasksTabs';

interface ProjectTasksContentProps {
  project: Project;
  searchQuery: string;
  sortBy: string;
  todoTasks: Task[];
  inProgressTasks: Task[];
  completedTasks: Task[];
  progress: number;
  teamMembers: User[];
  isLoadingTeamMembers: boolean;
  onSearchChange: (query: string) => void;
  onSortByChange: (sortBy: string) => void;
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onTaskStatusChange: (taskId: string, status: TaskStatus) => Promise<void>;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const ProjectTasksContent: React.FC<ProjectTasksContentProps> = ({
  project,
  searchQuery,
  sortBy,
  todoTasks,
  inProgressTasks,
  completedTasks,
  progress,
  teamMembers,
  isLoadingTeamMembers,
  onSearchChange,
  onSortByChange,
  onCreateTask,
  onEditTask,
  onTaskStatusChange,
  onRefresh,
  isRefreshing
}) => {
  console.log('ProjectTasksContent: Rendering with:', {
    projectTitle: project?.title,
    todoTasksCount: todoTasks?.length || 0,
    inProgressTasksCount: inProgressTasks?.length || 0,
    completedTasksCount: completedTasks?.length || 0,
    teamMembersCount: teamMembers?.length || 0
  });

  const allTasks = [...(todoTasks || []), ...(inProgressTasks || []), ...(completedTasks || [])];

  return (
    <div className="space-y-6">
      {/* Project Overview */}
      <ProjectOverview
        project={project}
        tasks={allTasks}
        teamMembers={teamMembers || []}
        progress={progress || 0}
      />

      {/* Header Actions */}
      <div className="flex justify-between items-center px-8">
        <h2 className="text-2xl font-bold">Project Tasks</h2>
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
          <Button onClick={onCreateTask}>
            Add Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-8">
        <ProjectTasksFilters
          searchQuery={searchQuery || ''}
          sortBy={sortBy || 'deadline'}
          onSearchChange={onSearchChange}
          onSortByChange={onSortByChange}
        />
      </div>

      {/* Tasks Tabs (replacing the grid) */}
      <ProjectTasksTabs
        todoTasks={todoTasks || []}
        inProgressTasks={inProgressTasks || []}
        completedTasks={completedTasks || []}
        onEdit={onEditTask}
        onStatusChange={onTaskStatusChange}
      />
    </div>
  );
};

export default ProjectTasksContent;
