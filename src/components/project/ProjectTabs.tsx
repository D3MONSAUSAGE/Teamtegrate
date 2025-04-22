
import React from 'react';
import { Project } from '@/types';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import ProjectList from '../ProjectList';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProjectTabsProps {
  projects: Project[];
  searchQuery: string;
  onEditProject: (project: Project) => void;
  onViewTasks: (project: Project) => void;
  onCreateProject: () => void;
  onCreateTask: (project: Project) => void;
}

const ProjectTabs: React.FC<ProjectTabsProps> = ({
  projects,
  searchQuery,
  onEditProject,
  onViewTasks,
  onCreateProject,
  onCreateTask,
}) => {
  const isMobile = useIsMobile();

  const todoProjects = projects.filter(project => project.status === 'To Do');
  const inProgressProjects = projects.filter(project => project.status === 'In Progress');
  const completedProjects = projects.filter(project => project.status === 'Completed');

  return (
    <Tabs defaultValue="todo" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger 
          value="todo"
          className={`${isMobile ? 'text-xs py-1.5 px-2' : ''}`}
        >
          To Do ({todoProjects.length})
        </TabsTrigger>
        <TabsTrigger 
          value="inprogress"
          className={`${isMobile ? 'text-xs py-1.5 px-2' : ''}`}
        >
          In Progress ({inProgressProjects.length})
        </TabsTrigger>
        <TabsTrigger 
          value="completed"
          className={`${isMobile ? 'text-xs py-1.5 px-2' : ''}`}
        >
          Completed ({completedProjects.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="todo">
        <ProjectList
          projects={todoProjects}
          searchQuery={searchQuery}
          onEditProject={onEditProject}
          onViewTasks={onViewTasks}
          onCreateProject={onCreateProject}
          onCreateTask={onCreateTask}
        />
      </TabsContent>

      <TabsContent value="inprogress">
        <ProjectList
          projects={inProgressProjects}
          searchQuery={searchQuery}
          onEditProject={onEditProject}
          onViewTasks={onViewTasks}
          onCreateProject={onCreateProject}
          onCreateTask={onCreateTask}
        />
      </TabsContent>

      <TabsContent value="completed">
        <ProjectList
          projects={completedProjects}
          searchQuery={searchQuery}
          onEditProject={onEditProject}
          onViewTasks={onViewTasks}
          onCreateProject={onCreateProject}
          onCreateTask={onCreateTask}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ProjectTabs;
