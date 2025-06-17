
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Project } from '@/types';
import { Calendar, Users, DollarSign, Plus, AlertTriangle, CheckCircle } from 'lucide-react';
import { format, isAfter } from 'date-fns';

interface ProjectProgressCardsProps {
  projects: Project[];
  onCreateTask?: (project: Project) => void;
}

const ProjectProgressCards: React.FC<ProjectProgressCardsProps> = ({ 
  projects, 
  onCreateTask 
}) => {
  const getProgressPercentage = (project: Project) => {
    switch (project.status) {
      case 'Completed': return 100;
      case 'In Progress': return 65; // Estimated progress
      default: return 10;
    }
  };

  const getBudgetPercentage = (project: Project) => {
    if (!project.budget || project.budget === 0) return 0;
    return Math.min((project.budgetSpent / project.budget) * 100, 100);
  };

  const isOverdue = (project: Project) => {
    return isAfter(new Date(), new Date(project.endDate)) && project.status !== 'Completed';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'In Progress': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      default: return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
    }
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-lg font-medium">No Projects Found</p>
        <p className="text-sm">Create your first project to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => {
        const progress = getProgressPercentage(project);
        const budgetProgress = getBudgetPercentage(project);
        const overdueStatus = isOverdue(project);

        return (
          <Card key={project.id} className="bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6 space-y-4">
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg text-foreground leading-tight line-clamp-2">
                    {project.title}
                  </h3>
                  {overdueStatus && (
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 ml-2" />
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                  {overdueStatus && (
                    <Badge variant="destructive" className="text-xs">
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>

              {/* Description */}
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}

              {/* Progress Section */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Budget Progress */}
                {project.budget > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Budget Used</span>
                      <span className="font-medium">{Math.round(budgetProgress)}%</span>
                    </div>
                    <Progress 
                      value={budgetProgress} 
                      className={`h-2 ${budgetProgress > 90 ? '[&>div]:bg-red-500' : budgetProgress > 70 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>${project.budgetSpent.toLocaleString()}</span>
                      <span>${project.budget.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="text-xs text-muted-foreground">Due</div>
                  <div className="text-sm font-medium">
                    {format(new Date(project.endDate), 'MMM d')}
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="text-xs text-muted-foreground">Team</div>
                  <div className="text-sm font-medium">{project.teamMemberIds?.length || 0}</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircle className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="text-xs text-muted-foreground">Tasks</div>
                  <div className="text-sm font-medium">{project.tasksCount || 0}</div>
                </div>
              </div>

              {/* Budget Info */}
              {project.budget > 0 && (
                <div className="pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Remaining:</span>
                    </div>
                    <span className="font-medium text-green-600">
                      ${(project.budget - project.budgetSpent).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 flex justify-end">
                {onCreateTask && (
                  <Button 
                    size="sm" 
                    onClick={() => onCreateTask(project)}
                    className="h-8 px-3 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Task
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProjectProgressCards;
