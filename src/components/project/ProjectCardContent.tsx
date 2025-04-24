
import React from 'react';
import { CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, ListTodo } from 'lucide-react';
import { format } from 'date-fns';
import { Project, Task } from '@/types';
import ProjectTeamMembers from './ProjectTeamMembers';

interface ProjectCardContentProps {
  project: Project;
  teamMembers: any[];
  isLoading: boolean;
  onViewTasks: () => void;
}

const ProjectCardContent: React.FC<ProjectCardContentProps> = ({
  project,
  teamMembers,
  isLoading,
  onViewTasks,
}) => {
  const tasks = project?.tasks || [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const progress = calculateProgress(tasks);
  const budgetProgress = project.budget 
    ? Math.round((project.budgetSpent || 0) / project.budget * 100) 
    : 0;
  const assignedTasksCount = tasks.filter(task => task.assignedToId).length;

  return (
    <CardContent className="space-y-2 pt-0 md:pt-1 px-3 pb-3">
      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 min-h-[2rem]">
        {project.description || "No description provided"}
      </p>
      
      <div className="flex flex-wrap items-center justify-between pt-1 md:pt-2 gap-y-1">
        <div className="flex items-center text-xs text-gray-500 gap-1">
          <Calendar className="h-3 w-3 flex-shrink-0 text-gray-400" />
          <span className="truncate">
            {format(new Date(project.startDate), 'MMM d')} - {format(new Date(project.endDate), 'MMM d')}
          </span>
        </div>
        
        <div className="flex items-center text-xs text-gray-500 gap-1">
          <Users className="h-3 w-3 flex-shrink-0 text-gray-400" />
          <span>{assignedTasksCount} assigned</span>
        </div>
      </div>
      
      {!isLoading && teamMembers.length > 0 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-500">Team:</span>
          <ProjectTeamMembers members={teamMembers} />
        </div>
      )}

      <RenderProgressSection 
        totalTasks={totalTasks} 
        completedTasks={completedTasks} 
        progress={progress} 
      />
      
      {project.budget && (
        <RenderBudgetSection 
          budget={project.budget} 
          budgetSpent={project.budgetSpent || 0} 
          budgetProgress={budgetProgress} 
        />
      )}
      
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full mt-2 text-xs flex items-center justify-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-900/20" 
        onClick={onViewTasks}
      >
        <ListTodo className="h-3 w-3 flex-shrink-0" /> View Tasks
      </Button>
    </CardContent>
  );
};

const calculateProgress = (tasks: Task[] = []): number => {
  if (!tasks || tasks.length === 0) return 0;
  const completed = tasks.filter(task => task.status === 'Completed').length;
  return Math.round((completed / tasks.length) * 100);
};

const RenderProgressSection = ({ totalTasks, completedTasks, progress }: { 
  totalTasks: number; 
  completedTasks: number; 
  progress: number; 
}) => (
  <div className="pt-2 space-y-1">
    <div className="flex justify-between items-center">
      <div className="flex items-center text-xs font-medium">
        <ListTodo className="h-3 w-3 mr-1 text-blue-500 flex-shrink-0" />
        <span>{totalTasks} {totalTasks === 1 ? 'Task' : 'Tasks'}</span>
      </div>
      <Badge 
        variant={progress === 100 ? "outline" : progress > 0 ? "outline" : "secondary"}
        className={`ml-1 text-xs ${
          progress === 100 ? "bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" : ""
        }`}
      >
        {progress}%
      </Badge>
    </div>
    <div className="flex justify-between items-center text-xs text-gray-500">
      <span>{completedTasks} of {totalTasks} completed</span>
    </div>
    <Progress 
      value={progress} 
      className="h-1.5 md:h-2"
      color={progress === 100 ? "bg-green-500" : undefined}
    />
  </div>
);

const RenderBudgetSection = ({ budget, budgetSpent, budgetProgress }: {
  budget: number;
  budgetSpent: number;
  budgetProgress: number;
}) => (
  <div className="mt-3 space-y-1">
    <div className="flex justify-between items-center text-xs text-gray-500">
      <span>Budget: ${budget.toLocaleString()}</span>
      <Badge 
        variant={budgetProgress > 100 ? "destructive" : "outline"} 
        className="ml-1"
      >
        {budgetProgress}%
      </Badge>
    </div>
    <div className="flex justify-between items-center text-xs text-gray-500">
      <span>Spent: ${budgetSpent.toLocaleString()}</span>
    </div>
    <Progress 
      value={Math.min(budgetProgress, 100)} 
      className={`h-1.5 md:h-2 ${
        budgetProgress > 100 ? "bg-red-500" : budgetProgress > 90 ? "bg-amber-500" : ""
      }`}
    />
  </div>
);

export default ProjectCardContent;
