
import React, { useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { Project, ProjectStatus } from '@/types';
import { useTask } from '@/contexts/task';

interface ProjectProgressBarProps {
  project: Project;
}

const ProjectProgressBar: React.FC<ProjectProgressBarProps> = ({ project }) => {
  const { updateProject } = useTask();
  
  // Calculate progress based on task completion
  const calculateProgress = () => {
    const totalTasks = project.tasks_count;
    if (totalTasks === 0) return 0;
    
    const completedTasks = project.tasks?.filter(task => task.status === 'Completed').length || 0;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  const progress = calculateProgress();
  
  // Auto-update project status when all tasks are complete and progress reaches 100%
  useEffect(() => {
    const shouldBeCompleted = progress === 100 && project.tasks_count > 0;
    
    // Only update if the status doesn't match what it should be
    if (shouldBeCompleted && project.status !== 'Completed') {
      console.log(`Auto-updating project ${project.id} to Completed status as all tasks are done`);
      updateProject(project.id, { 
        status: 'Completed' as ProjectStatus,
        is_completed: true
      });
    }
  }, [progress, project.id, project.status, project.tasks_count, updateProject]);

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
