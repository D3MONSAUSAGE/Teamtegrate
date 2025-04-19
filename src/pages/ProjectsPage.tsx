
import React, { useState, useEffect } from 'react';
import { useTask } from '@/contexts/task';
import { Project, Task } from '@/types';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import AssignTaskDialog from '@/components/AssignTaskDialog';
import ProjectToolbar from '@/components/ProjectToolbar';
import ProjectList from '@/components/ProjectList';
import ProjectTasksDialog from '@/components/ProjectTasksDialog';
import { supabase } from '@/integrations/supabase/client';

const ProjectsPage = () => {
  const { projects, fetchProjects } = useTask();
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
  
  // Refresh projects when page loads
  useEffect(() => {
    if (fetchProjects) {
      console.log("Fetching projects on page load");
      fetchProjects();
    }
  }, [fetchProjects]);
  
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
  
  // Handle dialog closings - refresh data when needed
  const handleTaskDialogChange = (open: boolean) => {
    setIsCreateTaskOpen(open);
    if (!open && fetchProjects) {
      console.log("Refreshing projects after task dialog closed");
      // Refresh projects data when task dialog closes
      fetchProjects();
    }
  };
  
  const handleViewTasksDialogChange = (open: boolean) => {
    setIsViewTasksOpen(open);
    if (!open && fetchProjects) {
      console.log("Refreshing projects after task view dialog closed");
      // Refresh projects data when task dialog closes
      fetchProjects();
    }
  };
  
  const handleProjectDialogChange = (open: boolean) => {
    setIsCreateProjectOpen(open);
    if (!open && fetchProjects) {
      console.log("Refreshing projects after project dialog closed");
      // Refresh projects data when project dialog closes
      fetchProjects();
    }
  };
  
  // Filter projects based on search query
  const filteredProjects = projects.filter((project) => {
    return (
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  
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
      default:
        return 0;
    }
  });
  
  return (
    <div className="p-6">
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
      />
      
      <CreateProjectDialog 
        open={isCreateProjectOpen} 
        onOpenChange={handleProjectDialogChange}
        editingProject={editingProject}
      />
      
      <ProjectTasksDialog 
        open={isViewTasksOpen}
        onOpenChange={handleViewTasksDialogChange}
        project={selectedProject}
        onCreateTask={() => handleCreateTask(selectedProject)}
        onEditTask={handleEditTask}
        onAssignTask={handleAssignTask}
      />
      
      <CreateTaskDialog 
        open={isCreateTaskOpen} 
        onOpenChange={handleTaskDialogChange}
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
