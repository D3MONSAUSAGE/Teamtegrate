
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Project, Task } from '@/types';
import { Plus } from 'lucide-react';
import TaskCard from '@/components/TaskCard';

interface ProjectTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
}

const ProjectTasksDialog: React.FC<ProjectTasksDialogProps> = ({
  open,
  onOpenChange,
  project,
  onCreateTask,
  onEditTask,
}) => {
  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{project?.title} - Tasks</DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-end mb-4">
          <Button onClick={onCreateTask}>
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </Button>
        </div>
        
        {project && project.tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
            {project.tasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={onEditTask} 
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
