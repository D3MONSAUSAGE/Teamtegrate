
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Lightbulb,
  Target,
  Users,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Task } from '@/types';
import { useOrganizationStats } from '@/hooks/useOrganizationStats';
import { isTaskOverdue } from '@/utils/taskUtils';

interface SmartInsightsPanelProps {
  tasks: Task[];
}

const SmartInsightsPanel: React.FC<SmartInsightsPanelProps> = ({ tasks }) => {
  const { stats } = useOrganizationStats();
  
  const overdueTasks = tasks.filter(task => isTaskOverdue(task));
  const completedTasks = tasks.filter(task => task.status === 'Completed');
  const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  const insights = [
    {
      type: 'success',
      title: 'Strong Team Performance',
      description: `Your team has maintained a ${Math.round(completionRate)}% completion rate this month, which is above industry average.`,
      icon: CheckCircle2,
      action: 'View team analytics',
      priority: 'high'
    },
    {
      type: 'warning',
      title: 'Task Bottleneck Detected',
      description: `${overdueTasks.length} tasks are overdue. Consider redistributing workload or extending deadlines.`,
      icon: AlertTriangle,
      action: 'Review overdue tasks',
      priority: 'high'
    },
    {
      type: 'info',
      title: 'Productivity Optimization',
      description: 'Based on your team\'s patterns, scheduling critical tasks between 9-11 AM increases completion rates by 23%.',
      icon: Lightbulb,
      action: 'Optimize schedule',
      priority: 'medium'
    },
    {
      type: 'opportunity',
      title: 'Resource Allocation',
      description: `With ${stats?.total_users || 0} team members across ${stats?.active_projects || 0} projects, consider adding 1-2 more contributors to high-priority initiatives.`,
      icon: Users,
      action: 'Review staffing',
      priority: 'medium'
    }
  ];

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-dashboard-success/10',
          border: 'border-dashboard-success/20',
          text: 'text-dashboard-success',
          iconBg: 'bg-dashboard-success/10'
        };
      case 'warning':
        return {
          bg: 'bg-dashboard-warning/10',
          border: 'border-dashboard-warning/20',
          text: 'text-dashboard-warning',
          iconBg: 'bg-dashboard-warning/10'
        };
      case 'info':
        return {
          bg: 'bg-dashboard-primary/10',
          border: 'border-dashboard-primary/20',
          text: 'text-dashboard-primary',
          iconBg: 'bg-dashboard-primary/10'
        };
      case 'opportunity':
        return {
          bg: 'bg-dashboard-teal/10',
          border: 'border-dashboard-teal/20',
          text: 'text-dashboard-teal',
          iconBg: 'bg-dashboard-teal/10'
        };
      default:
        return {
          bg: 'bg-dashboard-gray-50',
          border: 'border-dashboard-gray-200',
          text: 'text-dashboard-gray-600',
          iconBg: 'bg-dashboard-gray-100'
        };
    }
  };

  return (
    <Card className="border-0 shadow-base bg-dashboard-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-dashboard-primary/10 flex items-center justify-center">
              <Brain className="h-5 w-5 text-dashboard-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-dashboard-gray-900">
                Smart Insights
              </CardTitle>
              <p className="text-sm text-dashboard-gray-600">
                AI-powered recommendations for your team
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-dashboard-primary/10 text-dashboard-primary">
            {insights.length} insights
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {insights.map((insight, index) => {
          const colors = getInsightColor(insight.type);
          
          return (
            <div 
              key={index}
              className={`p-4 rounded-lg border ${colors.bg} ${colors.border} hover:shadow-sm transition-all duration-200`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg ${colors.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <insight.icon className={`h-5 w-5 ${colors.text}`} />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-dashboard-gray-900">
                      {insight.title}
                    </h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${insight.priority === 'high' ? 'border-dashboard-error/20 text-dashboard-error' : 'border-dashboard-gray-200 text-dashboard-gray-600'}`}
                    >
                      {insight.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-dashboard-gray-600 leading-relaxed">
                    {insight.description}
                  </p>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={`${colors.text} hover:${colors.bg} p-0 h-auto font-medium`}
                  >
                    {insight.action}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        
        <div className="pt-4 border-t border-dashboard-border">
          <Button 
            variant="outline" 
            className="w-full border-dashboard-border hover:bg-dashboard-card-hover"
          >
            View All Insights & Analytics
            <TrendingUp className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartInsightsPanel;
