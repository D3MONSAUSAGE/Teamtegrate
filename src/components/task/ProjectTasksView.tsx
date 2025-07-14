
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Task, Project, User, TaskStatus } from '@/types';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import { useOrganizationTeamMembers } from '@/hooks/useOrganizationTeamMembers';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/utils/performanceUtils';
import { toast } from '@/components/ui/sonner';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus } from 'lucide-react';
import ProjectTasksContent from './project-view/ProjectTasksContent';
import EditProjectDialog from '../project/EditProjectDialog';
import EnhancedCreateTaskDialog from '../task/EnhancedCreateTaskDialog';
import { supabase } from '@/integrations/supabase/client';

interface ProjectTasksViewProps {
  projectId: string | undefined;
}

const ProjectTasksView: React.FC<ProjectTasksViewProps> = ({ projectId }) => {
  const { user } = useAuth();
  const { tasks, isLoading, error, refetch } = useProjectTasks(projectId);
  const { users, isLoading: isLoadingTeamMembers, refetch: refetchTeamMembers } = useOrganizationTeamMembers();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('deadline');

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId || !user?.organizationId) return;

      try {
        setIsLoadingProject(true);
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .eq('organization_id', user.organizationId)
          .single();

        if (error) throw error;

        const transformedProject: Project = {
          id: data.id,
          title: data.title || 'Untitled Project',
          description: data.description || '',
          startDate: data.start_date || '',
          endDate: data.end_date || '',
          budget: data.budget || 0,
          budgetSpent: data.budget_spent || 0,
          isCompleted: data.is_completed || false,
          teamMemberIds: data.team_members || [],
          tasksCount: data.tasks_count || 0,
          tags: data.tags || [],
          managerId: data.manager_id || '',
          status: data.status || 'To Do',
          organizationId: data.organization_id,
          createdAt: new Date(data.created_at || Date.now()),
          updatedAt: new Date(data.updated_at || Date.now())
        };

        setProject(transformedProject);
      } catch (error) {
        console.error('Error fetching project:', error);
        toast.error('Failed to load project');
      } finally {
        setIsLoadingProject(false);
      }
    };

    fetchProject();
  }, [projectId, user?.organizationId]);

  // Project authorization check
  const canEditProject = useMemo(() => {
    if (!user || !project) return false;
    return project.managerId === user.id || 
           project.teamMemberIds?.includes(user.id) ||
           ['admin', 'superadmin'].includes(user.role);
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

  // Calculate progress
  const progress = useMemo(() => {
    const totalTasks = tasks.length;
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks.length / totalTasks) * 100);
  }, [tasks.length, completedTasks.length]);

  // Handlers
  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  }, []);

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
    // Refetch project data
    if (projectId && user?.organizationId) {
      const fetchProject = async () => {
        try {
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .eq('organization_id', user.organizationId)
            .single();

          if (error) throw error;
          
          const transformedProject: Project = {
            id: data.id,
            title: data.title || 'Untitled Project',
            description: data.description || '',
            startDate: data.start_date || '',
            endDate: data.end_date || '',
            budget: data.budget || 0,
            budgetSpent: data.budget_spent || 0,
            isCompleted: data.is_completed || false,
            teamMemberIds: data.team_members || [],
            tasksCount: data.tasks_count || 0,
            tags: data.tags || [],
            managerId: data.manager_id || '',
            status: data.status || 'To Do',
            organizationId: data.organization_id,
            createdAt: new Date(data.created_at || Date.now()),
            updatedAt: new Date(data.updated_at || Date.now())
          };

          setProject(transformedProject);
        } catch (error) {
          console.error('Error refetching project:', error);
        }
      };
      fetchProject();
    }
  }, [projectId, user?.organizationId]);

  const handleAddTeamMember = useCallback(async (userId: string) => {
    if (!project) return;

    try {
      const updatedTeamMemberIds = [...(project.teamMemberIds || []), userId];
      
      const { error } = await supabase
        .from('projects')
        .update({ team_members: updatedTeamMemberIds })
        .eq('id', project.id);

      if (error) throw error;
      
      setProject(prev => prev ? { ...prev, teamMemberIds: updatedTeamMemberIds } : null);
      refetchTeamMembers();
      toast.success('Team member added');
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error('Failed to add team member');
    }
  }, [project, refetchTeamMembers]);

  const handleRemoveTeamMember = useCallback(async (userId: string) => {
    if (!project) return;

    try {
      const updatedTeamMemberIds = (project.teamMemberIds || []).filter(id => id !== userId);
      
      const { error } = await supabase
        .from('projects')
        .update({ team_members: updatedTeamMemberIds })
        .eq('id', project.id);

      if (error) throw error;
      
      setProject(prev => prev ? { ...prev, teamMemberIds: updatedTeamMemberIds } : null);
      refetchTeamMembers();
      toast.success('Team member removed');
    } catch (error) {
      console.error('Error removing team member:', error);
      toast.error('Failed to remove team member');
    }
  }, [project, refetchTeamMembers]);

  const handleSearchQueryChange = useDebounce((value: string) => {
    setSearchQuery(value);
  }, 300);

  if (isLoadingProject || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  return (
    <>
      <ProjectTasksContent
        project={project}
        searchQuery={searchQuery}
        sortBy={sortBy}
        todoTasks={todoTasks}
        inProgressTasks={inProgressTasks}
        completedTasks={completedTasks}
        progress={progress}
        teamMembers={teamMembers}
        isLoadingTeamMembers={isLoadingTeamMembers}
        onSearchChange={handleSearchQueryChange}
        onSortByChange={setSortBy}
        onCreateTask={handleCreateTask}
        onEditTask={handleEditTask}
        onTaskStatusChange={handleStatusChange}
        onRefresh={refetch}
        isRefreshing={isLoading}
        onEditProject={handleEditProject}
        onAddTeamMember={handleAddTeamMember}
        onRemoveTeamMember={handleRemoveTeamMember}
      />

      <EnhancedCreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        currentProjectId={projectId}
        onTaskComplete={handleTaskDialogComplete}
      />

      {project && (
        <EditProjectDialog
          open={isEditProjectOpen}
          onOpenChange={setIsEditProjectOpen}
          project={project}
          onSuccess={handleProjectUpdated}
        />
      )}
    </>
  );
};

export default ProjectTasksView;
