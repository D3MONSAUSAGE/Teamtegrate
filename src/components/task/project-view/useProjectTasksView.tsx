
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { Task, TaskStatus } from '@/types';
import { toast } from '@/components/ui/sonner';

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

  // Find the project
  const project = useMemo(() => {
    if (!projectId) return null;
    return projects.find(p => p.id === projectId) || null;
  }, [projects, projectId]);

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

  // Check if project exists and user has access
  useEffect(() => {
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

    // Wait for projects to load
    if (projects.length === 0) {
      console.log('Projects still loading, keeping loading state');
      setIsLoading(true);
      setLoadError(null);
      return;
    }

    const foundProject = projects.find(p => p.id === projectId);
    
    if (!foundProject) {
      console.log('Project not found in accessible projects', { projectId, availableProjects: projects.map(p => p.id) });
      setLoadError("Project not found or you don't have access to it");
      setIsLoading(false);
      return;
    }

    // Check if user has access (is manager or team member)
    const isManager = foundProject.managerId === user.id;
    const isTeamMember = foundProject.teamMembers?.some(memberId => 
      String(memberId) === String(user.id)
    );
    
    console.log('Access check results', {
      isManager,
      isTeamMember,
      foundProject: foundProject.title,
      managerId: foundProject.managerId,
      userId: user.id,
      teamMembers: foundProject.teamMembers
    });
    
    if (!isManager && !isTeamMember) {
      setLoadError("You don't have access to this project");
      setIsLoading(false);
      return;
    }

    // Clear any previous errors and set loading to false
    console.log('Project access confirmed, clearing errors');
    setLoadError(null);
    setIsLoading(false);
  }, [projectId, user, projects, project]);

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
