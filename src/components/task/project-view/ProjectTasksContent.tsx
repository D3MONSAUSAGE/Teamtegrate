
import React, { useState } from 'react';
import { Project, Task, TaskStatus, User } from '@/types';
import { Button } from '@/components/ui/button';
import { RefreshCw, MessageSquare } from 'lucide-react';
import ProjectOverview from './ProjectOverview';
import ProjectTasksFilters from './ProjectTasksFilters';
import ProjectTasksTabs from './ProjectTasksTabs';
import ProjectActionToolbar from './ProjectActionToolbar';
import TeamManagementDialog from './TeamManagementDialog';
import ViewControlsPanel from './ViewControlsPanel';
import ProjectLogDialog from '../../project/ProjectLogDialog';
import ProjectLogSection from '../../project/ProjectLogSection';
import { useProjectViewState } from './hooks/useProjectViewState';

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
    showCompleted,
    showOverview,
    handleAssigneeFilter,
    handlePriorityFilter,
    toggleCompleted,
    toggleOverview
  } = useProjectViewState(allTasks);

  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [showProjectLog, setShowProjectLog] = useState(false);

  // Filter tasks by the view state
  const filteredTodoTasks = filteredTasks.filter(task => task.status === 'To Do');
  const filteredInProgressTasks = filteredTasks.filter(task => task.status === 'In Progress');
  const filteredCompletedTasks = showCompleted 
    ? filteredTasks.filter(task => task.status === 'Completed')
    : [];

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

  const handleOpenProjectLog = () => {
    setShowProjectLog(true);
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

      {/* Project Overview - Conditionally Rendered */}
      {showOverview && (
        <ProjectOverview
          project={project}
          tasks={allTasks}
          teamMembers={teamMembers || []}
          progress={progress || 0}
        />
      )}

      {/* Enhanced View Controls Panel */}
      <ViewControlsPanel
        viewMode={viewMode}
        sortBy={sortBy || 'deadline'}
        onSortByChange={onSortByChange}
        teamMembers={teamMembers || []}
        selectedAssignee={selectedAssignee}
        onAssigneeFilter={handleAssigneeFilter}
        selectedPriority={selectedPriority}
        onPriorityFilter={handlePriorityFilter}
        showCompleted={showCompleted}
        onToggleCompleted={toggleCompleted}
        showOverview={showOverview}
        onToggleOverview={toggleOverview}
      />

      {/* Header Actions */}
      <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-semibold">Project Tasks</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenProjectLog}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Updates ({project.comments?.length || 0})
          </Button>
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
      <div className="px-4 sm:px-6 lg:px-8">
        <ProjectTasksFilters
          searchQuery={searchQuery || ''}
          sortBy={sortBy || 'deadline'}
          onSearchChange={onSearchChange}
          onSortByChange={onSortByChange}
        />
      </div>

      {/* Project Log Section - Inline */}
      <div className="px-4 sm:px-6 lg:px-8">
        <ProjectLogSection 
          projectId={project.id}
          projectComments={project.comments || []}
        />
      </div>

      {/* Tasks Display - Now with Filtered Data */}
      <ProjectTasksTabs
        todoTasks={filteredTodoTasks || []}
        inProgressTasks={filteredInProgressTasks || []}
        completedTasks={filteredCompletedTasks || []}
        onEdit={onEditTask}
        onStatusChange={onTaskStatusChange}
      />

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

      {/* Project Log Dialog */}
      <ProjectLogDialog
        open={showProjectLog}
        onOpenChange={setShowProjectLog}
        projectId={project.id}
        projectTitle={project.title}
        projectComments={project.comments || []}
      />
    </div>
  );
};

export default ProjectTasksContent;
