
import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Project } from '@/types';
import { format, isAfter } from 'date-fns';
import { Calendar, List, Plus, Trash2, AlertTriangle, Users } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ProjectCardProps {
  project: Project;
  onViewTasks?: () => void;
  onCreateTask?: () => void;
  onDeleted?: () => void;
}

const statusColors = {
  'To Do': 'bg-yellow-500/10 text-yellow-700 border-yellow-500',
  'In Progress': 'bg-blue-500/10 text-blue-700 border-blue-500',
  'Completed': 'bg-green-500/10 text-green-700 border-green-500'
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onViewTasks, onCreateTask, onDeleted }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteProject, updateProject } = useTask();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteProject(project.id);
      toast.success("Project deleted successfully");
      if (onDeleted) {
        onDeleted();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error("Failed to delete project");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateProject(project.id, { 
        status: newStatus as Project['status'],
        is_completed: newStatus === 'Completed'
      });
      toast.success("Project status updated");
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error("Failed to update project status");
    }
  };

  // Calculate days left or overdue
  const calculateDaysRemaining = () => {
    const today = new Date();
    const endDate = new Date(project.endDate);
    
    if (project.status === 'Completed') {
      return null; // No need to show days remaining for completed projects
    }
    
    if (isAfter(today, endDate)) {
      const daysOverdue = Math.ceil((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
      return { overdue: true, days: daysOverdue };
    } else {
      const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { overdue: false, days: daysLeft };
    }
  };

  const timeInfo = calculateDaysRemaining();
  
  // Calculate progress based on task completion
  const calculateProgress = () => {
    const totalTasks = project.tasks_count;
    if (totalTasks === 0) return 0;
    
    const completedTasks = project.tasks?.filter(task => task.status === 'Completed').length || 0;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  const progress = calculateProgress();

  return (
    <>
      <Card className="h-full flex flex-col overflow-hidden border hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold line-clamp-1">{project.title}</h3>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">
                  {format(new Date(project.startDate), 'MMM d')} - {format(new Date(project.endDate), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge 
              variant="outline" 
              className={`${statusColors[project.status]} text-xs`}
            >
              {project.status}
            </Badge>
            
            <Badge variant="outline" className="text-xs">
              {project.tasks_count} {project.tasks_count === 1 ? 'task' : 'tasks'}
            </Badge>
            
            {timeInfo && timeInfo.overdue && (
              <Badge variant="destructive" className="flex gap-1 items-center">
                <AlertTriangle className="h-3 w-3" /> 
                {timeInfo.days} {timeInfo.days === 1 ? 'day' : 'days'} overdue
              </Badge>
            )}
            
            {timeInfo && !timeInfo.overdue && (
              <Badge variant="secondary" className="text-xs">
                {timeInfo.days} {timeInfo.days === 1 ? 'day' : 'days'} left
              </Badge>
            )}
            
            {project.teamMembers && project.teamMembers.length > 0 && (
              <Badge variant="outline" className="flex gap-1 items-center text-xs">
                <Users className="h-3 w-3" />
                {project.teamMembers.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        
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
              <Select defaultValue={project.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="To Do">To Do</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {project.budget > 0 && (
            <div className="text-sm text-gray-600 mb-4">
              <span className="font-medium">Budget:</span> ${project.budget.toFixed(2)}
              {project.budgetSpent !== undefined && project.budgetSpent > 0 && (
                <div className="flex justify-between mt-1">
                  <span className="text-xs">Spent: ${project.budgetSpent.toFixed(2)}</span>
                  <span className="text-xs">
                    {Math.round((project.budgetSpent / project.budget) * 100)}%
                  </span>
                </div>
              )}
            </div>
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
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              and all associated tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectCard;
