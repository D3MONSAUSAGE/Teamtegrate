
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Project } from '@/types';
import { TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface ProjectHealthOverviewProps {
  projects: Project[];
}

const ProjectHealthOverview: React.FC<ProjectHealthOverviewProps> = ({ projects }) => {
  const getHealthStats = () => {
    const total = projects.length;
    const completed = projects.filter(p => p.status === 'Completed').length;
    const inProgress = projects.filter(p => p.status === 'In Progress').length;
    const overdue = projects.filter(p => 
      new Date(p.endDate) < new Date() && p.status !== 'Completed'
    ).length;
    
    const overallHealth = total > 0 ? Math.round(((completed + (inProgress * 0.5)) / total) * 100) : 0;
    
    return { total, completed, inProgress, overdue, overallHealth };
  };

  const stats = getHealthStats();

  const healthColor = stats.overallHealth >= 80 ? 'text-green-600' : 
                     stats.overallHealth >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <Card className="bg-card/80 backdrop-blur-sm border shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Project Health Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Health Score */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${healthColor} mb-2`}>
            {stats.overallHealth}%
          </div>
          <div className="text-sm text-muted-foreground mb-3">Overall Health Score</div>
          <Progress value={stats.overallHealth} className="h-3" />
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-lg font-bold text-green-600">{stats.completed}</span>
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>

          <div className="text-center p-3 rounded-lg bg-muted/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-lg font-bold text-blue-600">{stats.inProgress}</span>
            </div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>

          <div className="text-center p-3 rounded-lg bg-muted/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-lg font-bold text-red-600">{stats.overdue}</span>
            </div>
            <div className="text-xs text-muted-foreground">Overdue</div>
          </div>

          <div className="text-center p-3 rounded-lg bg-muted/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-lg font-bold text-primary">{stats.total}</span>
            </div>
            <div className="text-xs text-muted-foreground">Total Projects</div>
          </div>
        </div>

        {/* Status Distribution */}
        {stats.total > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Project Distribution</div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-green-600 border-green-600">
                {Math.round((stats.completed / stats.total) * 100)}% Complete
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                {Math.round((stats.inProgress / stats.total) * 100)}% Active
              </Badge>
              {stats.overdue > 0 && (
                <Badge variant="outline" className="text-red-600 border-red-600">
                  {Math.round((stats.overdue / stats.total) * 100)}% Overdue
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectHealthOverview;
