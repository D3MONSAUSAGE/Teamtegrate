
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { Task, TaskStatus, Project, ProjectStatus } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { checkProjectAccess } from '@/hooks/projects/projectAccessFilter';

export const useProjectTasksView = (projectId: string | null) => {
  const { user } = useAuth();
  const { projects, tasks, updateTaskStatus } = useTask();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('deadline');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [fallbackProject, setFallbackProject] = useState<Project | null>(null);

  // Find the project - first try from context, then fallback
  const project = useMemo(() => {
    if (!projectId) return null;
    
    // First try to find in context projects
    const contextProject = projects.find(p => p.id === projectId);
    if (contextProject) return contextProject;
    
    // Return fallback project if we fetched one
    return fallbackProject;
  }, [projects, projectId, fallbackProject]);

  // Get project tasks
  const projectTasks = useMemo(() => {
    if (!projectId) return [];
    return tasks.filter(task => task.projectId === projectId);
  }, [tasks, projectId]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = projectTasks;
    
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'priority':
          const priorityValues = { 'High': 0, 'Medium': 1, 'Low': 2 };
          return priorityValues[a.priority] - priorityValues[b.priority];
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });
  }, [projectTasks, searchQuery, sortBy]);

  // Group tasks by status
  const todoTasks = useMemo(() => filteredTasks.filter(task => task.status === 'To Do'), [filteredTasks]);
  const inProgressTasks = useMemo(() => filteredTasks.filter(task => task.status === 'In Progress'), [filteredTasks]);
  const pendingTasks = useMemo(() => filteredTasks.filter(task => task.status === 'Pending'), [filteredTasks]);
  const completedTasks = useMemo(() => filteredTasks.filter(task => task.status === 'Completed'), [filteredTasks]);

  // Calculate progress
  const progress = useMemo(() => {
    const totalTasks = projectTasks.length;
    const completed = completedTasks.length;
    return totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
  }, [projectTasks.length, completedTasks.length]);

  // Fetch project directly from database as fallback
  const fetchProjectDirectly = useCallback(async (id: string) => {
    try {
      console.log('Fetching project directly from database:', id);
      
      const { data: projectData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching project directly:', error);
        return null;
      }

      if (!projectData) {
        console.log('Project not found in database');
        return null;
      }

      console.log('Found project in database:', projectData);

      // Check if user has access using the same logic as the main projects list
      const accessInfo = checkProjectAccess(projectData, user?.id || '', []);
      
      console.log('Direct access check results:', {
        projectTitle: projectData.title,
        accessInfo,
        userId: user?.id
      });

      if (!accessInfo.hasAccess) {
        console.log('User does not have access to project');
        return null;
      }

      // Convert to Project format with proper type casting
      const formattedProject: Project = {
        id: projectData.id,
        title: projectData.title || '',
        description: projectData.description || '',
        startDate: projectData.start_date ? new Date(projectData.start_date) : new Date(),
        endDate: projectData.end_date ? new Date(projectData.end_date) : new Date(),
        managerId: projectData.manager_id || '',
        createdAt: projectData.created_at ? new Date(projectData.created_at) : new Date(),
        updatedAt: projectData.updated_at ? new Date(projectData.updated_at) : new Date(),
        tasks: projectTasks,
        teamMembers: projectData.team_members || [],
        budget: projectData.budget || 0,
        budgetSpent: projectData.budget_spent || 0,
        is_completed: projectData.is_completed || false,
        status: (projectData.status || 'To Do') as ProjectStatus,
        tasks_count: projectTasks.length,
        tags: projectData.tags || []
      };

      return formattedProject;
    } catch (error) {
      console.error('Error in fetchProjectDirectly:', error);
      return null;
    }
  }, [user?.id, projectTasks]);

  // Check if project exists and user has access
  useEffect(() => {
    const checkProjectAccess = async () => {
      console.log('useProjectTasksView effect running', {
        projectId,
        user: !!user,
        projectsLength: projects.length,
        foundProject: !!project
      });

      if (!projectId) {
        setLoadError("No project ID provided");
        setIsLoading(false);
        return;
      }

      if (!user) {
        setLoadError("User not authenticated");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      setFallbackProject(null);

      // First, try to find project in context
      const contextProject = projects.find(p => p.id === projectId);
      
      if (contextProject) {
        console.log('Found project in context:', contextProject.title);
        
        // Check access for context project
        const isManager = contextProject.managerId === user.id;
        const isTeamMember = contextProject.teamMembers?.some(memberId => 
          String(memberId) === String(user.id)
        );
        
        if (isManager || isTeamMember) {
          console.log('User has access to context project');
          setIsLoading(false);
          return;
        } else {
          console.log('User does not have access to context project');
          setLoadError("You don't have access to this project");
          setIsLoading(false);
          return;
        }
      }

      // If not found in context, try to fetch directly
      console.log('Project not found in context, fetching directly from database');
      
      const directProject = await fetchProjectDirectly(projectId);
      
      if (directProject) {
        console.log('Successfully fetched project directly, setting as fallback');
        setFallbackProject(directProject);
        setIsLoading(false);
      } else {
        console.log('Failed to fetch project directly or no access');
        setLoadError("Project not found or you don't have access to it");
        setIsLoading(false);
      }
    };

    checkProjectAccess();
  }, [projectId, user, projects, fetchProjectDirectly]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  }, []);

  const handleCreateTask = useCallback(() => {
    setEditingTask(undefined);
    setIsCreateTaskOpen(true);
  }, []);

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Refresh logic would go here if needed
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const handleTaskStatusChange = useCallback(async (taskId: string, status: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, status);
      toast.success(`Task status updated to ${status}`);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  }, [updateTaskStatus]);

  const onSortByChange = useCallback((newSortBy: string) => {
    setSortBy(newSortBy);
  }, []);

  const handleTaskDialogComplete = useCallback(() => {
    setIsCreateTaskOpen(false);
    setEditingTask(undefined);
  }, []);

  return {
    isLoading,
    loadError,
    project,
    searchQuery,
    sortBy,
    todoTasks,
    inProgressTasks,
    pendingTasks,
    completedTasks,
    progress,
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
  };
};
