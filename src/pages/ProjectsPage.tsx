
import React, { useState } from 'react';
import { useTask } from '@/contexts/task';
import { Project, Task } from '@/types';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import AssignTaskDialog from '@/components/AssignTaskDialog';
import ProjectToolbar from '@/components/ProjectToolbar';
import ProjectList from '@/components/ProjectList';
import ProjectTasksDialog from '@/components/ProjectTasksDialog';

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
