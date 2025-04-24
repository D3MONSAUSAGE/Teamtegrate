
import React, { useState } from 'react';
import { Project, Task } from '@/types';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import AssignTaskDialog from '@/components/AssignTaskDialog';
import ProjectTasksDialog from '@/components/ProjectTasksDialog';

interface ProjectContainerProps {
  children: React.ReactNode;
}

export const ProjectDialogsContext = React.createContext<{
  openCreateProject: () => void;
  openCreateTask: (project?: Project) => void;
  openViewTasks: (project: Project) => void;
  openEditProject: (project: Project) => void;
  openAssignTask: (task: Task) => void;
} | null>(null);

export const ProjectContainer: React.FC<ProjectContainerProps> = ({ children }) => {
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isViewTasksOpen, setIsViewTasksOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);

  const contextValue = {
    openCreateProject: () => {
      setEditingProject(undefined);
      setIsCreateProjectOpen(true);
    },
    openCreateTask: (project?: Project) => {
      setEditingTask(undefined);
      setSelectedProject(project || null);
      setIsCreateTaskOpen(true);
    },
    openViewTasks: (project: Project) => {
      setSelectedProject(project);
      setIsViewTasksOpen(true);
    },
    openEditProject: (project: Project) => {
      setEditingProject(project);
      setIsCreateProjectOpen(true);
    },
    openAssignTask: (task: Task) => {
      setSelectedTask(task);
      setIsAssignTaskOpen(true);
    }
  };

  return (
    <ProjectDialogsContext.Provider value={contextValue}>
      {children}

      <CreateProjectDialog 
        open={isCreateProjectOpen} 
        onOpenChange={setIsCreateProjectOpen}
        editingProject={editingProject}
      />
      
      <ProjectTasksDialog 
        open={isViewTasksOpen}
        onOpenChange={setIsViewTasksOpen}
        project={selectedProject}
        onCreateTask={() => contextValue.openCreateTask(selectedProject)}
        onEditTask={(task) => {
          setEditingTask(task);
          setIsCreateTaskOpen(true);
        }}
        onAssignTask={(task) => contextValue.openAssignTask(task)}
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
    </ProjectDialogsContext.Provider>
  );
};

export const useProjectDialogs = () => {
  const context = React.useContext(ProjectDialogsContext);
  if (!context) {
    throw new Error('useProjectDialogs must be used within a ProjectContainer');
  }
  return context;
};
