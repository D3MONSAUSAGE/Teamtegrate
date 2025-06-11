import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Project } from '@/types';
import { Calendar, Users, Target, DollarSign } from 'lucide-react';
import { format, isAfter } from 'date-fns';

interface ProjectSelectorProps {
  projects: Project[];
  selectedProject: string | null;
  onProjectSelect: (projectId: string) => void;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProject,
  onProjectSelect
}) => {
  const project = selectedProject ? projects.find(p => p.id === selectedProject) : null;
  
  // Calculate project progress based on status
  const calculateProgress = (project: Project) => {
    switch (project.status) {
      case 'Completed':
        return 100;
      case 'In Progress':
        return 50; // Default progress for in-progress projects
      default:
        return 0;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500';
      case 'In Progress':
        return 'bg-blue-500';
      default:
        return 'bg-yellow-500';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
          <CardDescription>
            Choose a project to view detailed reports and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedProject || ""} onValueChange={onProjectSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a project to analyze" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                    <span>{project.title}</span>
                    <Badge variant="outline" className="ml-auto">
                      {project.tasksCount} tasks
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {project && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {project.title}
            </CardTitle>
            <CardDescription>
              {project.description || 'No description provided'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Project Status and Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge className={`${getStatusColor(project.status)} text-white`}>
                  {project.status}
                </Badge>
              </div>
              <Progress value={calculateProgress(project)} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {calculateProgress(project)}% complete
              </p>
            </div>

            {/* Project Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Target className="h-3 w-3" />
                  <span className="text-xs">Tasks</span>
                </div>
                <p className="text-sm font-medium">{project.tasksCount}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span className="text-xs">Team</span>
                </div>
                <p className="text-sm font-medium">{project.teamMemberIds.length}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span className="text-xs">Start Date</span>
                </div>
                <p className="text-sm font-medium">
                  {format(new Date(project.startDate), 'MMM d, yyyy')}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span className="text-xs">End Date</span>
                </div>
                <p className="text-sm font-medium">
                  {format(new Date(project.endDate), 'MMM d, yyyy')}
                </p>
                {isAfter(new Date(), new Date(project.endDate)) && project.status !== 'Completed' && (
                  <Badge variant="destructive" className="text-xs">
                    Overdue
                  </Badge>
                )}
              </div>
            </div>

            {/* Budget Information */}
            {project.budget > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  <span className="text-xs">Budget</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Allocated:</span>
                    <span className="font-medium">${project.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Spent:</span>
                    <span className="font-medium">${project.budgetSpent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Remaining:</span>
                    <span className="font-medium text-green-600">
                      ${(project.budget - project.budgetSpent).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectSelector;
