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
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';

interface ProjectCardProps {
  project: Project;
  onViewTasks?: () => void;
  onCreateTask?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onViewTasks, onCreateTask }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteProject } = useTask();

  const handleDelete = async () => {
    try {
      await deleteProject(project.id);
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error("Failed to delete project");
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{project.title}</h3>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <Calendar className="w-4 h-4 mr-1" />
                <span>
                  {format(project.startDate, 'MMM d')} - {format(project.endDate, 'MMM d, yyyy')}
                </span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {project.description || 'No description provided'}
          </p>
          
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectCard;
