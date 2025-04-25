
import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Project } from '@/types';
import { format } from 'date-fns';
import { Calendar, List, Plus, Trash2 } from 'lucide-react';
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
} from "@/components/ui/select"
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';
import { Badge } from "@/components/ui/badge";

interface ProjectCardProps {
  project: Project;
  onViewTasks?: () => void;
  onCreateTask?: () => void;
  onDeleted?: () => void;
}

const statusColors = {
  'To Do': 'bg-yellow-500',
  'In Progress': 'bg-blue-500',
  'Completed': 'bg-green-500'
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

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{project.title}</h3>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">
                  {format(project.startDate, 'MMM d')} - {format(project.endDate, 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {project.tasks_count} {project.tasks_count === 1 ? 'task' : 'tasks'}
                </Badge>
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
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {project.description || 'No description provided'}
          </p>
          
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

          {project.budget > 0 && (
            <div className="text-sm text-gray-600 mb-4">
              <span className="font-medium">Budget:</span> ${project.budget.toFixed(2)}
              {project.budgetSpent !== undefined && (
                <span className="ml-2">
                  (Spent: ${project.budgetSpent.toFixed(2)})
                </span>
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
