
import React from 'react';
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Project } from '@/types';
import { List, Plus } from 'lucide-react';
import { ProjectStatusSelect } from './ProjectStatusSelect';

interface ProjectCardContentProps {
  project: Project;
  onViewTasks?: () => void;
  onCreateTask?: () => void;
}

const ProjectCardContent: React.FC<ProjectCardContentProps> = ({ project, onViewTasks, onCreateTask }) => {
  // Calculate progress based on task completion
  const calculateProgress = () => {
    const totalTasks = project.tasks_count;
    if (totalTasks === 0) return 0;
    
    const completedTasks = project.tasks?.filter(task => task.status === 'Completed').length || 0;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  const progress = calculateProgress();

  return (
    <CardContent className="flex-1 flex flex-col pt-0">
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
        {project.description || 'No description provided'}
      </p>
      
      <div className="space-y-4 mb-4">
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
        
        <div className="mb-4">
          <ProjectStatusSelect project={project} />
        </div>
      </div>

      {project.budget > 0 && (
        <ProjectBudgetInfo 
          budget={project.budget} 
          budgetSpent={project.budgetSpent || 0} 
        />
      )}
      
      {(onViewTasks || onCreateTask) && (
        <div className="mt-auto pt-4 flex gap-2 justify-end">
          {onViewTasks && (
            <Button variant="outline" size="sm" onClick={onViewTasks}>
              <List className="w-4 h-4 mr-1" /> Tasks
            </Button>
          )}
          {onCreateTask && (
            <Button size="sm" onClick={onCreateTask}>
              <Plus className="w-4 h-4 mr-1" /> Task
            </Button>
          )}
        </div>
      )}
    </CardContent>
  );
};

// Nested component for budget information
interface ProjectBudgetInfoProps {
  budget: number;
  budgetSpent: number;
}

const ProjectBudgetInfo: React.FC<ProjectBudgetInfoProps> = ({ budget, budgetSpent }) => {
  return (
    <div className="text-sm text-gray-600 mb-4">
      <span className="font-medium">Budget:</span> ${budget.toFixed(2)}
      {budgetSpent > 0 && (
        <div className="flex justify-between mt-1">
          <span className="text-xs">Spent: ${budgetSpent.toFixed(2)}</span>
          <span className="text-xs">
            {Math.round((budgetSpent / budget) * 100)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ProjectCardContent;
