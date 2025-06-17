
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Project } from '@/types';
import { Calendar, Users, DollarSign, Plus, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { Link } from 'react-router-dom';

interface ProjectProgressCardsProps {
  projects: Project[];
  onCreateTask?: (project: Project) => void;
  showHeader?: boolean;
}

const ProjectProgressCards: React.FC<ProjectProgressCardsProps> = ({ 
  projects, 
  onCreateTask,
  showHeader = true
}) => {
  const getProgressPercentage = (project: Project) => {
    switch (project.status) {
      case 'Completed': return 100;
      case 'In Progress': return 65;
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

  const displayProjects = projects.slice(0, 3);

  if (projects.length === 0) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border shadow-lg">
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-lg font-medium mb-2">No Projects Found</p>
            <p className="text-sm">Create your first project to get started</p>
            <Link to="/dashboard/projects">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-purple-500/20 to-purple-600/20">
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Active Projects</h3>
          </div>
          <Link to="/dashboard/projects">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-500/10">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {displayProjects.map((project) => {
          const progress = getProgressPercentage(project);
          const budgetProgress = getBudgetPercentage(project);
          const overdueStatus = isOverdue(project);

          return (
            <Card key={project.id} className="bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6 space-y-4">
                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-lg text-foreground leading-tight line-clamp-2">
                      {project.title}
                    </h4>
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

      {projects.length > 3 && (
        <div className="text-center pt-2">
          <Link to="/dashboard/projects">
            <Button variant="outline" size="sm">
              View {projects.length - 3} more projects
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProjectProgressCards;
