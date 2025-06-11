
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
  
  // Auto-update project status when progress changes
  useEffect(() => {
    const projectTasks = tasks.filter(task => task.projectId === project.id);
    const totalTasks = projectTasks.length;
    
    if (totalTasks === 0) return;
    
    const completedTasks = projectTasks.filter(task => task.status === 'Completed').length;
    const allTasksCompleted = completedTasks === totalTasks;
    
    console.log(`Project ${project.id} progress check: ${completedTasks}/${totalTasks} tasks completed (${progress}%)`);
    console.log(`Current status: ${project.status}, All completed: ${allTasksCompleted}, Is completed flag: ${project.isCompleted}`);
    
    // Make sure project status is consistent with task completion
    if (allTasksCompleted && project.status !== 'Completed') {
      console.log(`Auto-updating project ${project.id} to Completed status as all tasks are done`);
      updateProject(project.id, { 
        status: 'Completed' as ProjectStatus,
        isCompleted: true
      });
    } else if (!allTasksCompleted && project.status === 'Completed') {
      console.log(`Auto-updating project ${project.id} to In Progress status as not all tasks are done`);
      updateProject(project.id, { 
        status: 'In Progress' as ProjectStatus,
        isCompleted: false
      });
    }
  }, [progress, project.id, project.status, project.isCompleted, tasks, updateProject]);

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
