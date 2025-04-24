
import React, { useState, useEffect, useCallback } from 'react';
import { useTask } from '@/contexts/task';
import { Project, Task } from '@/types';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import AssignTaskDialog from '@/components/AssignTaskDialog';
import ProjectToolbar from '@/components/ProjectToolbar';
import ProjectList from '@/components/ProjectList';
import ProjectTasksDialog from '@/components/ProjectTasksDialog';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const ProjectsPage = () => {
  const { projects, addProject } = useTask();
  const { user } = useAuth();
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isViewTasksOpen, setIsViewTasksOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  
  useEffect(() => {
    // This effect will set localProjects whenever the global projects state changes
    if (Array.isArray(projects)) {
      setLocalProjects(projects);
      setIsLoading(false);
      setError(undefined);
    }
  }, [projects]);
  
  // Manual retry function that will fetch projects directly
  const handleRetry = useCallback(async () => {
    if (!user) {
      toast.error('You must be logged in to view projects');
      return;
    }
    
    setIsLoading(true);
    setError(undefined);
    
    try {
      console.log('Manually fetching projects for user:', user.id);
      
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*');

      if (projectError) {
        throw new Error(`Failed to load projects: ${projectError.message}`);
      }

      if (!projectData || projectData.length === 0) {
        setLocalProjects([]);
        setIsLoading(false);
        return;
      }
      
      // Simple transformation just to show something
      const basicProjects = projectData.map(p => ({
        id: p.id,
        title: p.title || 'Untitled',
        description: p.description || '',
        startDate: new Date(p.start_date || new Date()),
        endDate: new Date(p.end_date || new Date()),
        managerId: p.manager_id || '',
        createdAt: new Date(p.created_at || new Date()),
        updatedAt: new Date(p.updated_at || new Date()),
        tasks: [],
        teamMembers: [],
        budget: p.budget || 0,
        budgetSpent: p.budget_spent || 0,
        is_completed: p.is_completed || false
      }));
      
      setLocalProjects(basicProjects);
      toast.success('Projects loaded successfully');
      
    } catch (err: any) {
      console.error('Manual project fetch failed:', err);
      setError(err.message || 'Failed to load projects');
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  // Call handleRetry on first load if there are no projects
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!Array.isArray(projects) || projects.length === 0) {
        handleRetry();
      }
    }, 2000); // Wait a bit to see if projects load normally
    
    return () => clearTimeout(timer);
  }, [projects, handleRetry]);
  
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsCreateProjectOpen(true);
  };
  
  const handleViewTasks = (project: Project) => {
    setSelectedProject(project);
    setIsViewTasksOpen(true);
  };
  
  const handleCreateTask = (project?: Project) => {
    setEditingTask(undefined);
    setSelectedProject(project || null);
    setIsCreateTaskOpen(true);
  };
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  };
  
  const handleAssignTask = (task: Task) => {
    setSelectedTask(task);
    setIsAssignTaskOpen(true);
  };

  const handleCreateProject = () => {
    setEditingProject(undefined);
    setIsCreateProjectOpen(true);
  };

  // Create a manual project function for direct testing
  const handleCreateBasicProject = async () => {
    if (!user) {
      toast.error('You must be logged in to create a project');
      return;
    }
    
    const basicProject = {
      title: `Test Project ${new Date().toLocaleTimeString()}`,
      description: 'This is a test project created directly',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      managerId: user.id,
      budget: 1000,
      teamMembers: []
    };
    
    const newProject = await addProject(basicProject);
    if (newProject) {
      toast.success('Test project created successfully!');
      handleRetry();
    }
  };

  // Filter projects based on search query
  const filteredProjects = Array.isArray(localProjects) 
    ? localProjects.filter((project) => {
        if (!project) return false;
        
        return (
          (project.title && project.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      })
    : [];
  
  // Sort projects based on the selected option
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'start':
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      case 'end':
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      case 'progress':
        const progressA = calculateProgress(a);
        const progressB = calculateProgress(b);
        return progressB - progressA;
      default:
        return 0;
    }
  });
  
  // Helper function to calculate project progress
  const calculateProgress = (project: Project): number => {
    if (!project.tasks || project.tasks.length === 0) return 0;
    const completed = project.tasks.filter(task => task.status === 'Completed').length;
    return Math.round((completed / project.tasks.length) * 100);
  };
  
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <ProjectToolbar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onCreateProject={handleCreateProject}
      />
      
      {/* Show debugging button in dev environment */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="mb-4">
          <button 
            onClick={handleRetry}
            className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded mr-2"
          >
            Refresh Projects
          </button>
          <button 
            onClick={handleCreateBasicProject}
            className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded"
          >
            Create Test Project
          </button>
        </div>
      )}
      
      <ProjectList 
        projects={sortedProjects}
        searchQuery={searchQuery}
        onEditProject={handleEditProject}
        onViewTasks={handleViewTasks}
        onCreateProject={handleCreateProject}
        onCreateTask={handleCreateTask}
        isLoading={isLoading}
        error={error}
        onRetry={handleRetry}
      />
      
      <CreateProjectDialog 
        open={isCreateProjectOpen} 
        onOpenChange={setIsCreateProjectOpen}
        editingProject={editingProject}
      />
      
      <ProjectTasksDialog 
        open={isViewTasksOpen}
        onOpenChange={setIsViewTasksOpen}
        project={selectedProject}
        onCreateTask={() => handleCreateTask(selectedProject)}
        onEditTask={handleEditTask}
        onAssignTask={handleAssignTask}
      />
      
      <CreateTaskDialog 
        open={isCreateTaskOpen} 
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        currentProjectId={selectedProject?.id}
      />
      
      {selectedTask && (
        <AssignTaskDialog 
          open={isAssignTaskOpen} 
          onOpenChange={setIsAssignTaskOpen}
          task={selectedTask}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
