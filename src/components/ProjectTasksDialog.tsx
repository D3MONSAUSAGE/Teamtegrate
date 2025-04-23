
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Project, Task, User } from '@/types';
import { Plus, Calendar, Users, X, AlertCircle, Loader2 } from 'lucide-react';
import TaskCard from '@/components/TaskCard';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import TaskCommentsDialog from './TaskCommentsDialog';
import ProjectTeamMembers from './project/ProjectTeamMembers';
import { fetchProjectTeamMembers } from '@/contexts/task/operations';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState<string>('all');
  
  useEffect(() => {
    const loadTeamMembers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (project?.id && open) {
          console.log('Fetching team members for project:', project.id);
          const members = await fetchProjectTeamMembers(project.id);
          console.log('Team members fetched:', members);
          setTeamMembers(members);
        }
      } catch (error) {
        console.error("Error loading team members:", error);
        setError("Failed to load team members");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (open && project) {
      loadTeamMembers();
    }
  }, [project?.id, open]);
  
  if (!project) return null;
  
  const calculateProgress = () => {
    if (!project.tasks || project.tasks.length === 0) return 0;
    const completed = project.tasks.filter(task => task.status === 'Completed').length;
    return Math.round((completed / project.tasks.length) * 100);
  };
  
  const progress = calculateProgress();
  
  const filteredTasks = project.tasks && project.tasks.length > 0
    ? project.tasks.filter(task => {
        if (taskFilter === 'all') return true;
        if (taskFilter === 'completed') return task.status === 'Completed';
        if (taskFilter === 'incomplete') return task.status !== 'Completed';
        return true;
      })
    : [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div className="flex flex-col">
              <DialogTitle className="text-xl">{project?.title}</DialogTitle>
              <div className="text-sm text-gray-500 mt-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(project.startDate), 'MMM d, yyyy')} - {format(new Date(project.endDate), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
            
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          
          <div className="mt-2">
            {project.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{project.description}</p>
            )}
            
            {!isLoading && !error && teamMembers.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">Team:</span>
                <ProjectTeamMembers members={teamMembers} maxDisplay={5} />
              </div>
            )}
            
            <div className="mb-4 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {project.tasks?.filter(task => task.status === 'Completed').length || 0} of {project.tasks?.length || 0} tasks completed
                </span>
                <Badge variant={progress === 100 ? "success" : "outline"}>
                  {progress}%
                </Badge>
              </div>
              <Progress 
                value={progress} 
                className="h-2"
                color={progress === 100 ? "bg-green-500" : undefined}
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Button 
                variant={taskFilter === 'all' ? "default" : "outline"} 
                size="sm"
                onClick={() => setTaskFilter('all')}
              >
                All
              </Button>
              <Button 
                variant={taskFilter === 'incomplete' ? "default" : "outline"} 
                size="sm"
                onClick={() => setTaskFilter('incomplete')}
              >
                In Progress
              </Button>
              <Button 
                variant={taskFilter === 'completed' ? "default" : "outline"} 
                size="sm"
                onClick={() => setTaskFilter('completed')}
              >
                Completed
              </Button>
            </div>
            
            <Button onClick={onCreateTask} className="gap-2">
              <Plus className="h-4 w-4" /> Add Task
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-gray-500">Loading tasks...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
              <p className="text-sm text-red-500 mb-2">Error loading project data</p>
              <p className="text-xs text-gray-500">{error}</p>
            </div>
          ) : project.tasks && project.tasks.length > 0 ? (
            <ScrollArea className="flex-1 w-full max-h-[60vh] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
                {filteredTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onEdit={onEditTask}
                    onAssign={() => onAssignTask(task)}
                  />
                ))}
                
                {filteredTasks.length === 0 && (
                  <div className="col-span-2 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg text-center">
                    <p className="text-gray-500">No {taskFilter !== 'all' ? taskFilter : ''} tasks found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg text-center">
              <p className="text-gray-500 mb-2">No tasks added to this project yet</p>
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
