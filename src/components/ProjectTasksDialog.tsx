
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Project, Task } from '@/types';
import { Plus, Users, Calendar } from 'lucide-react';
import TaskCard from '@/components/TaskCard';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ProjectTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onAssignTask: (task: Task) => void;
}

const ProjectTasksDialog: React.FC<ProjectTasksDialogProps> = ({
  open,
  onOpenChange,
  project,
  onCreateTask,
  onEditTask,
  onAssignTask,
}) => {
  if (!project) return null;
  
  const calculateProgress = () => {
    if (!project.tasks || project.tasks.length === 0) return 0;
    const completed = project.tasks.filter(task => task.status === 'Completed').length;
    return Math.round((completed / project.tasks.length) * 100);
  };
  
  const progress = calculateProgress();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{project?.title}</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            <div className="flex items-center gap-2 mt-2">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(project.startDate), 'MMM d, yyyy')} - {format(new Date(project.endDate), 'MMM d, yyyy')}</span>
            </div>
            <div className="mt-2">
              <p className="line-clamp-2">{project.description}</p>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs">
                  {project.tasks?.filter(task => task.status === 'Completed').length || 0} of {project.tasks?.length || 0} tasks completed
                </span>
                <Badge variant="outline">{progress}%</Badge>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end mb-4">
          <Button onClick={onCreateTask}>
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </Button>
        </div>
        
        {project.tasks && project.tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
            {project.tasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={onEditTask}
                onAssign={() => onAssignTask(task)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <p className="text-gray-500">No tasks added to this project yet</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2" 
              onClick={onCreateTask}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Task
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProjectTasksDialog;
