
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, SlidersHorizontal, Tag, RefreshCw } from "lucide-react";
import { useProjects } from '@/hooks/useProjects';
import ProjectCard from '@/components/project-card';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import CreateTaskDialogWithAI from '@/components/CreateTaskDialogWithAI';
import { ProjectStatus } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';

const ProjectsPage = () => {
  const { projects, isLoading, refreshProjects, error } = useProjects();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'All'>('All');
  const [tagFilter, setTagFilter] = useState<string | 'All'>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  // Modified effect to prevent infinite refreshing
  useEffect(() => {
    // Only try refreshing once if no projects and not loading
    if (!isLoading && !hasAttemptedRefresh) {
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
  }, [isLoading, hasAttemptedRefresh, refreshProjects]);

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
  
  const handleManualRefresh = async () => {
    try {
      setIsRefreshing(true);
      setHasAttemptedRefresh(false); // Reset refresh state
      await refreshProjects();
      toast.success("Projects refreshed successfully");
    } catch (error) {
      console.error("Error refreshing projects:", error);
      toast.error("Failed to refresh projects");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Extract all unique tags from projects
  const allTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    projects.forEach(project => {
      if (project.tags && project.tags.length) {
        project.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet);
  }, [projects]);

  // Enhanced search function to make it more flexible
  const filteredProjects = projects.filter(project => {
    // Make search more flexible by normalizing and relaxing the match criteria
    const matchesSearch = !searchQuery || 
                          project.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          // Include project ID in the search
                          project.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          // Check if tags contain the search query
                          (project.tags && project.tags.some(tag => 
                            tag.toLowerCase().includes(searchQuery.toLowerCase())
                          ));
    
    const matchesStatus = statusFilter === 'All' || project.status === statusFilter;
    
    const matchesTag = tagFilter === 'All' || 
                      (project.tags && project.tags.includes(tagFilter));
    
    return matchesSearch && matchesStatus && matchesTag;
  });

  // Log all projects for debugging
  useEffect(() => {
    if (projects.length > 0) {
      console.log(`Total projects loaded: ${projects.length}`);
      projects.forEach(p => console.log(`Project: ${p.id}, "${p.title}", Manager: ${p.managerId}`));
    }
  }, [projects]);

  // Show error state if there's an error
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Error loading projects: {error.message}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={handleManualRefresh} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Retry'}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse text-lg">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleManualRefresh} 
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search projects by name, description, ID or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              {statusFilter === 'All' ? 'All Statuses' : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={statusFilter} onValueChange={(value) => setStatusFilter(value as ProjectStatus | 'All')}>
              <DropdownMenuRadioItem value="All">All</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="To Do">To Do</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="In Progress">In Progress</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Completed">Completed</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {allTags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <Tag className="h-4 w-4" />
                {tagFilter === 'All' ? 'All Tags' : tagFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 max-h-80 overflow-auto">
              <DropdownMenuLabel>Filter by Tag</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={tagFilter} onValueChange={(value) => setTagFilter(value)}>
                <DropdownMenuRadioItem value="All">All Tags</DropdownMenuRadioItem>
                {allTags.map((tag) => (
                  <DropdownMenuRadioItem key={tag} value={tag}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="h-5 flex items-center">
                        <Tag className="h-3 w-3 mr-1" /> {tag}
                      </Badge>
                    </div>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Project count and search info */}
      <div className="mb-4 text-sm text-gray-500">
        Found {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} 
        {filteredProjects.length !== projects.length ? ` (filtered from ${projects.length} total)` : ''}
        {searchQuery && ` matching "${searchQuery}"`}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map(project => (
          <ProjectCard 
            key={project.id} 
            project={project}
            onViewTasks={() => handleViewTasks(project.id)}
            onCreateTask={() => handleCreateTask(project.id)}
            onDeleted={handleProjectDeleted}
          />
        ))}
        
        {projects.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 p-8 text-center border rounded-lg bg-white dark:bg-card">
            <p className="text-gray-500 mb-4">No projects found</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create First Project
            </Button>
          </div>
        )}
        
        {projects.length > 0 && filteredProjects.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 p-8 text-center border rounded-lg bg-white dark:bg-card">
            <p className="text-gray-500 mb-4">No matching projects found</p>
            <Button onClick={() => {
              setSearchQuery('');
              setStatusFilter('All');
              setTagFilter('All');
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      <CreateProjectDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
      />

      <CreateTaskDialogWithAI
        open={showCreateTaskDialog}
        onOpenChange={setShowCreateTaskDialog}
        editingTask={undefined}
        currentProjectId={selectedProjectId}
      />
    </div>
  );
};

export default ProjectsPage;
