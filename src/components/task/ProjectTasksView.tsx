import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Task, Project, User, TaskStatus } from '@/types';
import { useProject } from '@/hooks/useProject';
import { useTasks } from '@/hooks/useTasks';
import { useOrganizationTeamMembers } from '@/hooks/useOrganizationTeamMembers';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/utils/performanceUtils';
import { toast } from '@/components/ui/sonner';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus } from 'lucide-react';
import { ProjectTasksContent } from './ProjectTasksContent';
import EditProjectDialog from './EditProjectDialog';
import EnhancedCreateTaskDialog from '../task/EnhancedCreateTaskDialog';
import { ProjectService } from '@/services/projectService';

interface ProjectTasksViewProps {
  projectId: string | undefined;
}

const ProjectTasksView: React.FC<ProjectTasksViewProps> = ({ projectId }) => {
  const { user } = useAuth();
  const { project, isLoading: isLoadingProject, error: projectError, updateProject, refetch: refetchProject } = useProject(projectId);
  const { tasks, isLoading, error, refetch, updateTaskStatus } = useTasks(projectId);
  const { users, isLoading: isLoadingTeamMembers, refetch: refetchTeamMembers } = useOrganizationTeamMembers();

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Project authorization check
  const canEditProject = useMemo(() => {
    if (!user || !project) return false;
    return ProjectService.canEditProject(user, project);
  }, [user, project]);

  // Team members management
  const teamMembers = useMemo(() => {
    return users.filter(user => project?.teamMemberIds?.includes(user.id));
  }, [users, project]);

  // Task categorization
  const { todoTasks, inProgressTasks, completedTasks } = useMemo(() => {
    const todo: Task[] = [];
    const inProgress: Task[] = [];
    const completed: Task[] = [];

    tasks.forEach(task => {
      if (task.status === 'To Do') {
        todo.push(task);
      } else if (task.status === 'In Progress') {
        inProgress.push(task);
      } else if (task.status === 'Completed') {
        completed.push(task);
      }
    });

    return {
      todoTasks: todo,
      inProgressTasks: inProgress,
      completedTasks: completed
    };
  }, [tasks]);

  // Handlers
  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  }, []);

  const handleStatusChange = useCallback(async (taskId: string, status: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, status);
      refetch();
    } catch (error) {
      console.error('ProjectTasksView: Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  }, [updateTaskStatus, refetch]);

  const handleCreateTask = useCallback(() => {
    setEditingTask(undefined);
    setIsCreateTaskOpen(true);
  }, []);

  const handleTaskDialogComplete = useCallback(() => {
    setIsCreateTaskOpen(false);
    setEditingTask(undefined);
    refetch();
  }, [refetch]);

  const handleEditProject = useCallback(() => {
    setIsEditProjectOpen(true);
  }, []);

  const handleProjectUpdated = useCallback(() => {
    setIsEditProjectOpen(false);
    refetchProject();
  }, [refetchProject]);

  const handleToggleComplete = useCallback(async (completed: boolean) => {
    if (!project) return;

    try {
      await updateProject(project.id, { isCompleted: completed });
      refetchProject();
    } catch (error) {
      console.error('ProjectTasksView: Error toggling project completion:', error);
      toast.error('Failed to update project completion status');
    }
  }, [project, updateProject, refetchProject]);

  const handleAddTeamMember = useCallback(async (userId: string) => {
    if (!project) return;

    try {
      const updatedTeamMemberIds = [...(project.teamMemberIds || []), userId];
      await updateProject(project.id, { teamMemberIds: updatedTeamMemberIds });
      refetchProject();
      refetchTeamMembers();
    } catch (error) {
      console.error('ProjectTasksView: Error adding team member:', error);
      toast.error('Failed to add team member');
    }
  }, [project, updateProject, refetchProject, refetchTeamMembers]);

  const handleRemoveTeamMember = useCallback(async (userId: string) => {
    if (!project) return;

    try {
      const updatedTeamMemberIds = (project.teamMemberIds || []).filter(id => id !== userId);
      await updateProject(project.id, { teamMemberIds: updatedTeamMemberIds });
      refetchProject();
      refetchTeamMembers();
    } catch (error) {
      console.error('ProjectTasksView: Error removing team member:', error);
      toast.error('Failed to remove team member');
    }
  }, [project, updateProject, refetchProject, refetchTeamMembers]);

  const handleSearchQueryChange = useDebounce((value: string) => {
    setSearchQuery(value);
  }, 300);

  return (
    <>
      <ProjectTasksContent
        project={project}
        todoTasks={todoTasks}
        inProgressTasks={inProgressTasks}
        completedTasks={completedTasks}
        onEditTask={handleEditTask}
        onStatusChange={handleStatusChange}
        onCreateTask={handleCreateTask}
        onToggleComplete={handleToggleComplete}
        onCreateTaskClick={handleCreateTask}
        teamMembers={teamMembers}
        onAddTeamMember={handleAddTeamMember}
        onRemoveTeamMember={handleRemoveTeamMember}
        searchQuery={searchQuery}
        onSearchChange={handleSearchQueryChange}
        canEdit={canEditProject}
        onEditProject={handleEditProject}
        isLoadingTasks={isLoading}
        isLoadingTeamMembers={isLoadingTeamMembers}
      />

      <EnhancedCreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        currentProjectId={projectId}
        onTaskComplete={handleTaskDialogComplete}
      />

      <EditProjectDialog
        open={isEditProjectOpen}
        onOpenChange={setIsEditProjectOpen}
        project={project}
        onProjectUpdated={handleProjectUpdated}
      />
    </>
  );
};

export default ProjectTasksView;
