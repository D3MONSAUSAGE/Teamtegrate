
import React from 'react';
import { ListTodo } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Task, ProjectTask } from '@/types';

interface ProjectTaskProgressProps {
  tasks: Task[] | ProjectTask[];
}

const ProjectTaskProgress: React.FC<ProjectTaskProgressProps> = ({ tasks }) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="pt-1 md:pt-3 space-y-1">
      <div className="flex justify-between items-center">
        <div className="flex items-center text-xs font-medium">
          <ListTodo className="h-3 w-3 mr-1 text-blue-500 flex-shrink-0" />
          <span>{totalTasks} {totalTasks === 1 ? 'Task' : 'Tasks'}</span>
        </div>
        <Badge variant="outline" className="ml-1 text-xs">{progress}%</Badge>
      </div>
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>{completedTasks} of {totalTasks} completed</span>
      </div>
      <Progress value={progress} className="h-1.5 md:h-2" />
    </div>
  );
};

export default ProjectTaskProgress;
