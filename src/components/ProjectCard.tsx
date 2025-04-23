
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project, Task, User } from '@/types';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Calendar, Users, Plus, ListTodo, MoreHorizontal, CheckCircle } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTask } from '@/contexts/task';
import { fetchProjectTeamMembers } from '@/contexts/task/operations';
import ProjectTeamMembers from './project/ProjectTeamMembers';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onViewTasks?: (project: Project) => void;
  onCreateTask?: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onEdit, 
  onViewTasks, 
  onCreateTask 
}) => {
  const { deleteProject, updateProject } = useTask();
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  useEffect(() => {
    const loadTeamMembers = async () => {
      setIsLoading(true);
      if (project?.id) {
        try {
          const members = await fetchProjectTeamMembers(project.id);
          setTeamMembers(members);
        } catch (error) {
          console.error("Error loading team members:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    loadTeamMembers();
  }, [project?.id]);
  
  const calculateProgress = (tasks: Task[] = []) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.status === 'Completed').length;
    return Math.round((completed / tasks.length) * 100);
  };
  
  const handleDeleteProject = () => {
    if (confirmDelete) {
      deleteProject(project.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000); // Reset after 3 seconds
    }
  };
  
  const handleToggleCompletion = () => {
    updateProject(project.id, { is_completed: !project.is_completed });
    toast.success(project.is_completed ? 'Project marked as active' : 'Project marked as completed');
  };

  const tasks = project?.tasks || [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const progress = calculateProgress(tasks);
  
  const budgetProgress = project.budget 
    ? Math.round((project.budgetSpent || 0) / project.budget * 100) 
    : 0;
  
  const assignedTasksCount = tasks.filter(task => task.assignedToId).length;
  
  const isOverdue = project?.endDate && new Date(project.endDate) < new Date();
  const isCompletedProject = !!project?.is_completed;
  
  return (
    <Card className={`border-l-4 ${isCompletedProject 
      ? 'border-l-green-500 bg-green-50/30 dark:bg-green-900/10'
      : isOverdue 
        ? 'border-l-red-500 bg-red-50/30 dark:bg-red-900/10'
        : 'border-l-blue-500'
      } hover:shadow-md transition-all duration-200`}>
      <CardHeader className="pb-1 md:pb-2 flex flex-row justify-between items-start gap-2 pt-3 px-3">
        <div className="min-w-0 flex flex-col gap-1">
          <CardTitle className="text-sm md:text-base text-ellipsis overflow-hidden whitespace-nowrap">
            {project.title}
          </CardTitle>
          <div className="flex flex-wrap gap-1 mt-1">
            {isCompletedProject && (
              <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                <CheckCircle className="h-3 w-3" /> Completed
              </Badge>
            )}
            {isOverdue && !isCompletedProject && (
              <Badge variant="destructive">Overdue</Badge>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs md:text-sm w-52">
            <DropdownMenuItem onClick={() => onEdit && onEdit(project)}>
              Edit Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewTasks && onViewTasks(project)}>
              View Tasks
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateTask && onCreateTask(project)}>
              Add New Task
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleToggleCompletion}>
              {project.is_completed ? 'Mark as Active' : 'Mark as Completed'}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className={confirmDelete ? "text-red-500 font-semibold" : "text-red-500"} 
              onClick={handleDeleteProject}
            >
              {confirmDelete ? "Click again to confirm" : "Delete Project"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-2 pt-0 md:pt-1 px-3 pb-3">
        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 min-h-[2rem]">
          {project.description || "No description provided"}
        </p>
        
        <div className="flex flex-wrap items-center justify-between pt-1 md:pt-2 gap-y-1">
          <div className="flex items-center text-xs text-gray-500 gap-1">
            <Calendar className="h-3 w-3 flex-shrink-0 text-gray-400" />
            <span className="truncate">
              {format(new Date(project.startDate), 'MMM d')} - {format(new Date(project.endDate), 'MMM d')}
            </span>
          </div>
          
          <div className="flex items-center text-xs text-gray-500 gap-1">
            <Users className="h-3 w-3 flex-shrink-0 text-gray-400" />
            <span>{assignedTasksCount} assigned</span>
          </div>
        </div>
        
        {!isLoading && teamMembers.length > 0 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-gray-500">Team:</span>
            <ProjectTeamMembers members={teamMembers} />
          </div>
        )}
        
        <div className="pt-2 space-y-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center text-xs font-medium">
              <ListTodo className="h-3 w-3 mr-1 text-blue-500 flex-shrink-0" />
              <span>{totalTasks} {totalTasks === 1 ? 'Task' : 'Tasks'}</span>
            </div>
            <Badge 
              variant={progress === 100 ? "outline" : progress > 0 ? "outline" : "secondary"}
              className={cn(
                "ml-1 text-xs",
                progress === 100 ? "bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" : ""
              )}
            >
              {progress}%
            </Badge>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{completedTasks} of {totalTasks} completed</span>
          </div>
          <Progress 
            value={progress} 
            className="h-1.5 md:h-2"
            color={progress === 100 ? "bg-green-500" : undefined}
          />
        </div>
        
        {project.budget && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Budget: ${project.budget.toLocaleString()}</span>
              <Badge 
                variant={budgetProgress > 100 ? "destructive" : "outline"} 
                className="ml-1"
              >
                {budgetProgress}%
              </Badge>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Spent: ${(project.budgetSpent || 0).toLocaleString()}</span>
            </div>
            <Progress 
              value={Math.min(budgetProgress, 100)} 
              className={`h-1.5 md:h-2 ${budgetProgress > 100 ? "bg-red-500" : budgetProgress > 90 ? "bg-amber-500" : ""}`}
            />
          </div>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-2 text-xs flex items-center justify-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-900/20" 
          onClick={() => onViewTasks && onViewTasks(project)}
        >
          <ListTodo className="h-3 w-3 flex-shrink-0" /> View Tasks
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
