
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Project, Task } from '@/types';
import { Plus, Calendar } from 'lucide-react';
import TaskCard from '@/components/TaskCard';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import TaskCommentsDialog from './TaskCommentsDialog';
import { useTask } from '@/contexts/task';

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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { projects, fetchProjects } = useTask();
  
  // Get the latest project tasks from the projects context
  const currentProject = project ? projects.find(p => p.id === project.id) : null;
  const projectTasks = currentProject?.tasks || [];
  
  // Fetch projects data when the dialog opens to ensure we have latest data
  useEffect(() => {
    if (open && fetchProjects) {
      setIsLoading(true);
      
      // Handle fetchProjects safely - it might not return a Promise
      const fetchData = async () => {
        try {
          await fetchProjects();
        } catch (err) {
          console.error("Error fetching projects:", err);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchData();
    }
  }, [open, fetchProjects]);
  
  if (!project) return null;
  
  const calculateProgress = () => {
    if (projectTasks.length === 0) return 0;
    const completed = projectTasks.filter(task => task.status === 'Completed').length;
    return Math.round((completed / projectTasks.length) * 100);
  };
  
  const progress = calculateProgress();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{project?.title}</DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-2 mt-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(project.startDate), 'MMM d, yyyy')} - {format(new Date(project.endDate), 'MMM d, yyyy')}</span>
              </div>
              <div className="mt-2">
                <p>{project.description}</p>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs">
                    {projectTasks.filter(task => task.status === 'Completed').length} of {projectTasks.length} tasks completed
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
          
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : projectTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
              {projectTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onEdit={() => onEditTask(task)}
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
      
      <TaskCommentsDialog
        open={showComments}
        onOpenChange={setShowComments}
        task={selectedTask}
      />
    </>
  );
};

export default ProjectTasksDialog;
