
import React, { useState } from 'react';
import { Task, TaskStatus } from '@/types';
import CreateTaskDialogEnhanced from '../CreateTaskDialogEnhanced';
import EditProjectDialog from '../project/EditProjectDialog';
import ProjectTasksContent from './project-view/ProjectTasksContent';
import { useProjectTasksView } from './project-view/useProjectTasksView';
import ProjectTasksLoading from './project-view/ProjectTasksLoading';
import ProjectTasksError from './project-view/ProjectTasksError';
import { addTeamMemberToProject, removeTeamMemberFromProject } from '@/contexts/task/operations';
import { useProjects } from '@/hooks/useProjects';

interface ProjectTasksViewProps {
  projectId: string | undefined;
}

const ProjectTasksView: React.FC<ProjectTasksViewProps> = ({ projectId }) => {
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const { setProjects, refetch: refetchProjects } = useProjects();

  // Add error boundary for the hook
  let hookData;
  try {
    hookData = useProjectTasksView(projectId || null, refetchProjects);
  } catch (error) {
    console.error('ProjectTasksView: Error in useProjectTasksView hook:', error);
    return (
      <ProjectTasksError 
        errorMessage="Failed to load project tasks data"
        onRefresh={async () => window.location.reload()}
        isRefreshing={false}
      />
    );
  }

  const {
    isLoading,
    loadError,
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
  } = hookData;

  if (isLoading) {
    return <ProjectTasksLoading />;
  }
  
  if (loadError || !project) {
    return (
      <ProjectTasksError 
        errorMessage={loadError || "Project not found or not accessible."}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
      />
    );
  }

  // Create a wrapper function to convert the event to a string
  const handleSearchQueryChange = (query: string) => {
    // handleSearchChange expects a ChangeEvent, so we need to create a mock event
    const mockEvent = {
      target: { value: query }
    } as React.ChangeEvent<HTMLInputElement>;
    handleSearchChange(mockEvent);
  };

  // Handle editing project
  const handleEditProject = () => {
    setIsEditProjectOpen(true);
  };

  // Handle project edit success
  const handleProjectEditSuccess = () => {
    setIsEditProjectOpen(false);
    handleManualRefresh();
  };

  // Handle adding team member
  const handleAddTeamMember = async (userId: string) => {
    if (!projectId) return;
    
    try {
      await addTeamMemberToProject(projectId, userId, [], setProjects);
      // Refresh team members after adding
      handleManualRefresh();
    } catch (error) {
      console.error('Error adding team member:', error);
    }
  };

  // Handle removing team member
  const handleRemoveTeamMember = async (userId: string) => {
    if (!projectId) return;
    
    try {
      await removeTeamMemberFromProject(projectId, userId, [], setProjects);
      // Refresh team members after removing
      handleManualRefresh();
    } catch (error) {
      console.error('Error removing team member:', error);
    }
  };

  return (
    <>
      <ProjectTasksContent
        project={project}
        progress={progress}
        todoTasks={todoTasks || []}
        inProgressTasks={inProgressTasks || []}
        completedTasks={completedTasks || []}
        teamMembers={teamMembers || []}
        isLoadingTeamMembers={isLoadingTeamMembers}
        searchQuery={searchQuery || ''}
        sortBy={sortBy || 'deadline'}
        onSearchChange={handleSearchQueryChange}
        onSortByChange={onSortByChange}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        onEditTask={handleEditTask}
        onCreateTask={handleCreateTask}
        onTaskStatusChange={handleTaskStatusChange}
        onEditProject={handleEditProject}
        onAddTeamMember={handleAddTeamMember}
        onRemoveTeamMember={handleRemoveTeamMember}
      />
      
      <CreateTaskDialogEnhanced
        open={isCreateTaskOpen} 
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        currentProjectId={projectId ?? undefined}
        onTaskComplete={handleTaskDialogComplete}
      />

      <EditProjectDialog
        open={isEditProjectOpen}
        onOpenChange={setIsEditProjectOpen}
        project={project}
        onSuccess={handleProjectEditSuccess}
      />
    </>
  );
};

export default ProjectTasksView;
