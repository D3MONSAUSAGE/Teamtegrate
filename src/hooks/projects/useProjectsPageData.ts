
import { useState, useEffect, useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { ProjectStatus } from '@/types';

export const useProjectsPageData = () => {
  const { projects, isLoading, refreshProjects } = useProjects();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'All'>('All');
  const [tagFilter, setTagFilter] = useState<string | 'All'>('All');
  const navigate = useNavigate();

  // Modified effect to prevent infinite refreshing
  useEffect(() => {
    // Only try refreshing once if no projects and not loading
    if (projects.length === 0 && !isLoading && !hasAttemptedRefresh) {
      const handleRefresh = async () => {
        try {
          setHasAttemptedRefresh(true); // Mark that we've tried refreshing
          await refreshProjects();
        } catch (error) {
          console.error("Error refreshing projects:", error);
          toast.error("Failed to load projects. Please try again.");
        }
      };
      
      handleRefresh();
    }
  }, [projects.length, isLoading, hasAttemptedRefresh, refreshProjects]);

  // Extract all unique tags from projects
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    projects.forEach(project => {
      if (project.tags && project.tags.length) {
        project.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet);
  }, [projects]);

  // Filter projects based on search query, status, and tags
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            project.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || project.status === statusFilter;
      
      const matchesTag = tagFilter === 'All' || 
                        (project.tags && project.tags.includes(tagFilter));
      
      return matchesSearch && matchesStatus && matchesTag;
    });
  }, [projects, searchQuery, statusFilter, tagFilter]);

  const handleViewTasks = (projectId: string) => {
    navigate(`/dashboard/projects/${projectId}/tasks`);
  };

  const handleCreateTask = (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowCreateTaskDialog(true);
  };

  const handleProjectDeleted = () => {
    refreshProjects();
  };

  const handleCreateSuccess = () => {
    refreshProjects();
    toast.success("Project created successfully!");
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleStatusFilterChange = (value: ProjectStatus | 'All') => {
    setStatusFilter(value);
  };

  const handleTagFilterChange = (value: string) => {
    setTagFilter(value);
  };

  return {
    projects,
    filteredProjects,
    isLoading,
    showCreateDialog,
    setShowCreateDialog,
    showCreateTaskDialog,
    setShowCreateTaskDialog,
    selectedProjectId,
    searchQuery,
    statusFilter,
    tagFilter,
    allTags,
    handleViewTasks,
    handleCreateTask,
    handleProjectDeleted,
    handleCreateSuccess,
    handleSearchChange,
    handleStatusFilterChange,
    handleTagFilterChange,
  };
};

export default useProjectsPageData;
