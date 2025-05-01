
import React, { useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { Project, ProjectStatus } from '@/types';
import { useTask } from '@/contexts/task';

interface ProjectProgressBarProps {
  project: Project;
}

const ProjectProgressBar: React.FC<ProjectProgressBarProps> = ({ project }) => {
  const { updateProject, tasks } = useTask();
  
  // Calculate progress based on task completion
  const calculateProgress = () => {
    // Get all tasks that belong to this project
    const projectTasks = tasks.filter(task => task.projectId === project.id);
    const totalTasks = projectTasks.length;
    
    if (totalTasks === 0) return 0;
    
    const completedTasks = projectTasks.filter(task => task.status === 'Completed').length;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  const progress = calculateProgress();
  
  // Auto-update project status when all tasks are complete and progress reaches 100%
  useEffect(() => {
    const projectTasks = tasks.filter(task => task.projectId === project.id);
    const totalTasks = projectTasks.length;
    
    if (totalTasks === 0) return;
    
    const shouldBeCompleted = progress === 100;
    
    console.log(`Project ${project.id} progress: ${progress}%, tasks: ${totalTasks}, status: ${project.status}, should be completed: ${shouldBeCompleted}`);
    
    // Only update if the status doesn't match what it should be
    if (shouldBeCompleted && project.status !== 'Completed') {
      console.log(`Auto-updating project ${project.id} to Completed status as all tasks are done`);
      updateProject(project.id, { 
        status: 'Completed' as ProjectStatus,
        is_completed: true
      });
    }
  }, [progress, project.id, project.status, tasks, updateProject]);

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
