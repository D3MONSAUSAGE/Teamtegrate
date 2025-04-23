
import React, { useState, useEffect } from 'react';
import { useTask } from '@/contexts/task';
import { Project, Task } from '@/types';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import AssignTaskDialog from '@/components/AssignTaskDialog';
import ProjectToolbar from '@/components/ProjectToolbar';
import ProjectList from '@/components/ProjectList';
import ProjectTasksDialog from '@/components/ProjectTasksDialog';
import { toast } from '@/components/ui/sonner';

const ProjectsPage = () => {
  const { projects } = useTask();
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
  
  useEffect(() => {
    // Set initial loading state
    setIsLoading(true);
    
    // Check if projects are loaded or if there's an error
    const timer = setTimeout(() => {
      if (Array.isArray(projects)) {
        setIsLoading(false);
        setError(undefined);
      } else {
        setIsLoading(false);
        setError("Couldn't load projects. Please try again later.");
      }
    }, 1500); // Give it time to load
    
    return () => clearTimeout(timer);
  }, [projects]);
  
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

  // Filter projects based on search query
  const filteredProjects = Array.isArray(projects) 
    ? projects.filter((project) => {
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
      
      <ProjectList 
        projects={sortedProjects}
        searchQuery={searchQuery}
        onEditProject={handleEditProject}
        onViewTasks={handleViewTasks}
        onCreateProject={handleCreateProject}
        onCreateTask={handleCreateTask}
        isLoading={isLoading}
        error={error}
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
