
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Project } from '@/types';
import { DollarSign, TrendingUp, AlertTriangle, TrendingDown } from 'lucide-react';

interface ProjectBudgetMonitorProps {
  projects: Project[];
}

const ProjectBudgetMonitor: React.FC<ProjectBudgetMonitorProps> = ({ projects }) => {
  const budgetProjects = projects.filter(p => p.budget > 0);
  
  const getBudgetStats = () => {
    if (budgetProjects.length === 0) return null;
    
    const totalBudget = budgetProjects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = budgetProjects.reduce((sum, p) => sum + p.budgetSpent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    const overBudgetProjects = budgetProjects.filter(p => p.budgetSpent > p.budget).length;
    const nearBudgetProjects = budgetProjects.filter(p => 
      (p.budgetSpent / p.budget) > 0.8 && p.budgetSpent <= p.budget
    ).length;
    
    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      spentPercentage,
      overBudgetProjects,
      nearBudgetProjects,
      projectCount: budgetProjects.length
    };
  };

  const stats = getBudgetStats();

  if (!stats) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Monitor
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p>No projects with budgets found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getBudgetHealthColor = () => {
    if (stats.spentPercentage > 90) return 'text-red-600';
    if (stats.spentPercentage > 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressBarColor = () => {
    if (stats.spentPercentage > 90) return '[&>div]:bg-red-500';
    if (stats.spentPercentage > 75) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-green-500';
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Budget Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Budget Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Overall Budget Usage</span>
            <span className={`text-lg font-bold ${getBudgetHealthColor()}`}>
              {Math.round(stats.spentPercentage)}%
            </span>
          </div>
          <Progress 
            value={stats.spentPercentage} 
            className={`h-3 ${getProgressBarColor()}`}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Spent: ${stats.totalSpent.toLocaleString()}</span>
            <span>Total: ${stats.totalBudget.toLocaleString()}</span>
          </div>
        </div>

        {/* Budget Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-lg font-bold text-green-600">
                ${stats.totalRemaining.toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">Remaining Budget</div>
          </div>

          <div className="text-center p-3 rounded-lg bg-muted/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-primary" />
              <span className="text-lg font-bold text-primary">{stats.projectCount}</span>
            </div>
            <div className="text-xs text-muted-foreground">Tracked Projects</div>
          </div>
        </div>

        {/* Budget Alerts */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">Budget Alerts</div>
          
          {stats.overBudgetProjects > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div className="flex-1">
                <div className="text-sm font-medium text-red-800 dark:text-red-200">
                  {stats.overBudgetProjects} Over Budget
                </div>
                <div className="text-xs text-red-600 dark:text-red-300">
                  Immediate attention required
                </div>
              </div>
              <Badge variant="destructive" className="text-xs">
                Critical
              </Badge>
            </div>
          )}

          {stats.nearBudgetProjects > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div className="flex-1">
                <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {stats.nearBudgetProjects} Near Budget Limit
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-300">
                  Over 80% spent
                </div>
              </div>
              <Badge variant="outline" className="text-xs border-yellow-600 text-yellow-600">
                Warning
              </Badge>
            </div>
          )}

          {stats.overBudgetProjects === 0 && stats.nearBudgetProjects === 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div className="text-sm font-medium text-green-800 dark:text-green-200">
                All budgets are healthy
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="pt-4 border-t border-border/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-foreground">
                ${(stats.totalSpent / stats.projectCount).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Avg. Spent</div>
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">
                ${(stats.totalBudget / stats.projectCount).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Avg. Budget</div>
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">
                {Math.round((stats.totalRemaining / stats.totalBudget) * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Available</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectBudgetMonitor;
