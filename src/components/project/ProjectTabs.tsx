
import React from "react";
import { Project } from "@/types";
import { MobileTabs, MobileTabsContent, MobileTabsList, MobileTabsTrigger } from "@/components/ui/mobile-tabs";
import ProjectList from "./ProjectList";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface ProjectTabsProps {
  todoProjects: Project[];
  inProgressProjects: Project[];
  completedProjects: Project[];
  onViewTasks: (projectId: string) => void;
  onCreateTask: (projectId: string) => void;
  onProjectDeleted: () => void;
  onCreateProject: () => void;
}

const ProjectTabs: React.FC<ProjectTabsProps> = ({
  todoProjects,
  inProgressProjects,
  completedProjects,
  onViewTasks,
  onCreateTask,
  onProjectDeleted,
  onCreateProject,
}) => {
  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <MobileTabs defaultValue="todo" className="w-full">
        <MobileTabsList>
          <MobileTabsTrigger 
            value="todo"
            icon={<AlertCircle className="h-full w-full" />}
            label="To Do"
            count={todoProjects.length}
            activeColor="bg-gradient-to-r from-blue-500 to-blue-600"
          />
          <MobileTabsTrigger 
            value="inprogress"
            icon={<Clock className="h-full w-full" />}
            label="In Progress"
            count={inProgressProjects.length}
            activeColor="bg-gradient-to-r from-amber-500 to-orange-500"
          />
          <MobileTabsTrigger 
            value="completed"
            icon={<CheckCircle2 className="h-full w-full" />}
            label="Completed"
            count={completedProjects.length}
            activeColor="bg-gradient-to-r from-green-500 to-emerald-500"
          />
        </MobileTabsList>

        <MobileTabsContent value="todo">
          <ProjectList 
            projects={todoProjects} 
            onViewTasks={onViewTasks}
            onCreateTask={onCreateTask}
            onProjectDeleted={onProjectDeleted}
            onCreateProject={onCreateProject}
            emptyMessage="No projects to do" 
          />
        </MobileTabsContent>
        
        <MobileTabsContent value="inprogress">
          <ProjectList 
            projects={inProgressProjects} 
            onViewTasks={onViewTasks}
            onCreateTask={onCreateTask}
            onProjectDeleted={onProjectDeleted}
            onCreateProject={onCreateProject}
            emptyMessage="No projects in progress" 
          />
        </MobileTabsContent>
        
        <MobileTabsContent value="completed">
          <ProjectList 
            projects={completedProjects} 
            onViewTasks={onViewTasks}
            onCreateTask={onCreateTask}
            onProjectDeleted={onProjectDeleted}
            onCreateProject={onCreateProject}
            emptyMessage="No completed projects" 
          />
        </MobileTabsContent>
      </MobileTabs>
    </div>
  );
};

export default ProjectTabs;
