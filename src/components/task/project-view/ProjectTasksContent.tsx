
import React, { useState } from 'react';
import { Project, Task, TaskStatus, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ProjectOverview from './ProjectOverview';
import ProjectTasksFilters from './ProjectTasksFilters';
import ProjectTasksGrid from './ProjectTasksGrid';
import ProjectActionToolbar from './ProjectActionToolbar';
import TeamManagementDialog from './TeamManagementDialog';
import ViewControlsPanel from './ViewControlsPanel';
import ProjectTeamMembersSection from './ProjectTeamMembersSection';
import ProjectNotebookButton from '../../project/notebook/ProjectNotebookButton';
import ProjectNotebookDialog from '../../project/notebook/ProjectNotebookDialog';
import { useProjectViewState } from './hooks/useProjectViewState';
import { useProjectComments } from '@/hooks/useProjectComments';

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
  onEditProject?: () => void;
  onAddTeamMember?: (userId: string) => void;
  onRemoveTeamMember?: (userId: string) => void;
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
  isRefreshing,
  onEditProject,
  onAddTeamMember,
  onRemoveTeamMember
}) => {
  console.log('ProjectTasksContent: Rendering with:', {
    projectTitle: project?.title,
    todoTasksCount: todoTasks?.length || 0,
    inProgressTasksCount: inProgressTasks?.length || 0,
    completedTasksCount: completedTasks?.length || 0,
    teamMembersCount: teamMembers?.length || 0
  });

  const allTasks = [...(todoTasks || []), ...(inProgressTasks || []), ...(completedTasks || [])];
  
  const {
    viewMode,
    setViewMode,
    filteredTasks,
    selectedAssignee,
    selectedPriority,
    handleAssigneeFilter,
    handlePriorityFilter
  } = useProjectViewState(allTasks);

  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [showProjectNotebook, setShowProjectNotebook] = useState(false);
  
  // Get project comments for the notebook button
  const { comments } = useProjectComments(project.id);

  // Filter tasks by the view state
  const filteredTodoTasks = filteredTasks.filter(task => task.status === 'To Do');
  const filteredInProgressTasks = filteredTasks.filter(task => task.status === 'In Progress');
  const filteredCompletedTasks = filteredTasks.filter(task => task.status === 'Completed');

  const handleEditProject = () => {
    if (onEditProject) {
      onEditProject();
    }
  };

  const handleManageTeam = () => {
    setShowTeamManagement(true);
  };

  const handleAddTeamMember = (userId: string) => {
    if (onAddTeamMember) {
      onAddTeamMember(userId);
    }
  };

  const handleRemoveTeamMember = (userId: string) => {
    if (onRemoveTeamMember) {
      onRemoveTeamMember(userId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Project Action Toolbar */}
      <ProjectActionToolbar
        project={project}
        onEditProject={handleEditProject}
        onManageTeam={handleManageTeam}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Project Overview - Always shown */}
      <ProjectOverview
        project={project}
        tasks={allTasks}
        teamMembers={teamMembers || []}
        progress={progress || 0}
      />

      {/* Header with Project Journal Button */}
      <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Project Tasks</h2>
          <ProjectNotebookButton
            onClick={() => setShowProjectNotebook(true)}
            updateCount={comments.length}
            hasUnreadUpdates={false}
          />
        </div>
        <Button onClick={onCreateTask}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="px-4 sm:px-6 lg:px-8">
        <ProjectTasksFilters
          searchQuery={searchQuery || ''}
          sortBy={sortBy || 'deadline'}
          onSearchChange={onSearchChange}
          onSortByChange={onSortByChange}
        />
      </div>

      {/* Team Members Section */}
      <div className="px-4 sm:px-6 lg:px-8">
        <ProjectTeamMembersSection
          teamMembers={teamMembers || []}
          isLoading={isLoadingTeamMembers}
          onRetry={onRefresh}
          onManageTeam={handleManageTeam}
        />
      </div>

      {/* Filter Controls */}
      <div className="px-4 sm:px-6 lg:px-8">
        <ViewControlsPanel
          sortBy={sortBy || 'deadline'}
          onSortByChange={onSortByChange}
          teamMembers={teamMembers || []}
          selectedAssignee={selectedAssignee}
          onAssigneeFilter={handleAssigneeFilter}
          selectedPriority={selectedPriority}
          onPriorityFilter={handlePriorityFilter}
        />
      </div>

      {/* Tasks Display - Grid Layout */}
      <div className="px-4 sm:px-6 lg:px-8">
        <ProjectTasksGrid
          todoTasks={filteredTodoTasks || []}
          inProgressTasks={filteredInProgressTasks || []}
          completedTasks={filteredCompletedTasks || []}
          onEditTask={onEditTask}
          onStatusChange={onTaskStatusChange}
          teamMembers={teamMembers || []}
          isLoadingTeamMembers={isLoadingTeamMembers}
        />
      </div>

      {/* Team Management Dialog */}
      <TeamManagementDialog
        open={showTeamManagement}
        onOpenChange={setShowTeamManagement}
        project={project}
        teamMembers={teamMembers || []}
        isLoadingTeamMembers={isLoadingTeamMembers}
        onAddTeamMember={handleAddTeamMember}
        onRemoveTeamMember={handleRemoveTeamMember}
      />

      {/* Project Notebook Dialog */}
      <ProjectNotebookDialog
        open={showProjectNotebook}
        onOpenChange={setShowProjectNotebook}
        projectId={project.id}
        projectTitle={project.title}
      />
    </div>
  );
};

export default ProjectTasksContent;
