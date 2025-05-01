
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Project } from '@/types';

interface ProjectProgressBarProps {
  project: Project;
}

const ProjectProgressBar: React.FC<ProjectProgressBarProps> = ({ project }) => {
  // Calculate progress based on task completion
  const calculateProgress = () => {
    const totalTasks = project.tasks_count;
    if (totalTasks === 0) return 0;
    
    const completedTasks = project.tasks?.filter(task => task.status === 'Completed').length || 0;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  const progress = calculateProgress();

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span>Progress</span>
        <span>{progress}%</span>
      </div>
      <Progress 
        value={progress} 
        className={`h-2 ${
          progress < 30 ? 'bg-red-100' : 
          progress < 70 ? 'bg-yellow-100' : 
          'bg-green-100'
        }`}
      />
    </div>
  );
};

export default ProjectProgressBar;
