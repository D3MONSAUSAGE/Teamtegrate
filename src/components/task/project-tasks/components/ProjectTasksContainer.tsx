
import React, { useCallback, useMemo } from 'react';
import { TaskStatus, User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import { useOrganizationTeamMembers } from '@/hooks/useOrganizationTeamMembers';
import { useDebounce } from '@/utils/performanceUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import ProjectTasksHeader from './ProjectTasksHeader';
import ProjectTasksActions from './ProjectTasksActions';
import ProjectTasksBody from './ProjectTasksBody';
import ProjectTasksDialogs from './ProjectTasksDialogs';
import { useProjectData } from '../hooks/useProjectData';
import { useProjectTasksData } from '../hooks/useProjectTasksData';
import { useProjectTeamManagement } from '../hooks/useProjectTeamManagement';
import { useProjectDialogs } from '../hooks/useProjectDialogs';

interface ProjectTasksContainerProps {
  projectId: string | undefined;
}

const ProjectTasksContainer: React.FC<ProjectTasksContainerProps> = ({ projectId }) => {
  const { user } = useAuth();
  const { tasks, isLoading, refetch } = useProjectTasks(projectId);
  const { users, isLoading: isLoadingTeamMembers, refetch: refetchTeamMembers } = useOrganizationTeamMembers();
  
  // Search handling with debounce
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState('deadline');

  const handleSearchQueryChange = useDebounce((value: string) => {
    setSearchQuery(value);
  }, 300);

  // Custom hooks
  const { project, isLoadingProject, refetchProject } = useProjectData(projectId);
  const { todoTasks, inProgressTasks, completedTasks, progress } = useProjectTasksData(tasks, searchQuery, sortBy);
  const { handleAddTeamMember: addTeamMemberToProject, handleRemoveTeamMember } = useProjectTeamManagement(project, refetchTeamMembers);
  const {
    isCreateTaskOpen,
    setIsCreateTaskOpen,
    editingTask,
    isEditProjectOpen,
    setIsEditProjectOpen,
    handleEditTask,
    handleCreateTask,
    handleTaskDialogComplete,
    handleEditProject,
    handleProjectUpdated: baseHandleProjectUpdated
  } = useProjectDialogs(refetch);

  // Team members management
  const teamMembers = useMemo(() => {
    return users.filter(user => project?.teamMemberIds?.includes(user.id));
  }, [users, project]);

  // Project authorization check
  const canEditProject = useMemo(() => {
    if (!user || !project) return false;
    return project.managerId === user.id || 
           project.teamMemberIds?.includes(user.id) ||
           ['admin', 'superadmin'].includes(user.role);
  }, [user, project]);

  // Enhanced project updated handler
  const handleProjectUpdated = useCallback(() => {
    baseHandleProjectUpdated();
    refetchProject();
  }, [baseHandleProjectUpdated, refetchProject]);

  // Task status change handler
  const handleStatusChange = useCallback(async (taskId: string, status: TaskStatus) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          completed_at: status === 'Completed' ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;
      
      refetch();
      toast.success('Task status updated');
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  }, [refetch]);

  // Add team member handler - this creates a wrapper that doesn't take parameters
  const handleAddTeamMember = useCallback(() => {
    // For now, we'll show a toast indicating this feature needs implementation
    // In a real app, this would open a dialog to select users
    toast.info('Team member addition dialog not yet implemented');
    console.log('Add team member clicked - would open user selection dialog');
  }, []);

  if (!project) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <ProjectTasksHeader
        project={project}
        searchQuery={searchQuery}
        sortBy={sortBy}
        progress={progress}
        teamMembers={teamMembers}
        onSearchChange={handleSearchQueryChange}
        onSortByChange={setSortBy}
        onEditProject={handleEditProject}
      />

      <ProjectTasksActions
        canEditProject={canEditProject}
        isRefreshing={isLoading}
        onCreateTask={handleCreateTask}
        onEditProject={handleEditProject}
        onRefresh={refetch}
        onAddTeamMember={handleAddTeamMember}
      />

      <ProjectTasksBody
        todoTasks={todoTasks}
        inProgressTasks={inProgressTasks}
        completedTasks={completedTasks}
        teamMembers={teamMembers}
        onEditTask={handleEditTask}
        onTaskStatusChange={handleStatusChange}
      />

      <ProjectTasksDialogs
        project={project}
        projectId={projectId}
        isCreateTaskOpen={isCreateTaskOpen}
        setIsCreateTaskOpen={setIsCreateTaskOpen}
        editingTask={editingTask}
        isEditProjectOpen={isEditProjectOpen}
        setIsEditProjectOpen={setIsEditProjectOpen}
        onTaskDialogComplete={handleTaskDialogComplete}
        onProjectUpdated={handleProjectUpdated}
      />
    </div>
  );
};

export default ProjectTasksContainer;
