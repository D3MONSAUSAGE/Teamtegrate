
import React from 'react';
import { Project, Task, TaskStatus, User } from '@/types';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import ProjectOverview from './ProjectOverview';
import ProjectTasksFilters from './ProjectTasksFilters';
import ProjectTasksGrid from './ProjectTasksGrid';
import CreateTaskDialogWithAI from '@/components/CreateTaskDialogWithAI';

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
  teamMembersError: string | null;
  isRefreshing: boolean;
  isCreateTaskOpen: boolean;
  editingTask: Task | null;
  setIsCreateTaskOpen: (open: boolean) => void;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEditTask: (task: Task) => void;
  handleCreateTask: () => void;
  handleManualRefresh: () => void;
  handleTaskStatusChange: (taskId: string, status: TaskStatus) => void;
  onSortByChange: (sortBy: string) => void;
  handleTaskDialogComplete: () => void;
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
  teamMembersError,
  isRefreshing,
  isCreateTaskOpen,
  editingTask,
  setIsCreateTaskOpen,
  handleSearchChange,
  handleEditTask,
  handleCreateTask,
  handleManualRefresh,
  handleTaskStatusChange,
  onSortByChange,
  handleTaskDialogComplete
}) => {
  const allTasks = [...todoTasks, ...inProgressTasks, ...completedTasks];

  return (
    <div className="space-y-6">
      {/* Project Overview */}
      <ProjectOverview
        project={project}
        tasks={allTasks}
        teamMembers={teamMembers}
        progress={progress}
      />

      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Project Tasks</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleCreateTask}>
            Add Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ProjectTasksFilters
        searchQuery={searchQuery}
        sortBy={sortBy}
        onSearchChange={handleSearchChange}
        onSortByChange={onSortByChange}
      />

      {/* Team Members Error */}
      {teamMembersError && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Warning: Could not load team member details. {teamMembersError}
          </p>
        </div>
      )}

      {/* Tasks Grid */}
      <ProjectTasksGrid
        todoTasks={todoTasks}
        inProgressTasks={inProgressTasks}
        completedTasks={completedTasks}
        onEditTask={handleEditTask}
        onStatusChange={handleTaskStatusChange}
        teamMembers={teamMembers}
        isLoadingTeamMembers={isLoadingTeamMembers}
      />

      {/* Create/Edit Task Dialog */}
      <CreateTaskDialogWithAI
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask || undefined}
        currentProjectId={project.id}
        onTaskComplete={handleTaskDialogComplete}
      />
    </div>
  );
};

export default ProjectTasksContent;
