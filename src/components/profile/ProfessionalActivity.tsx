
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckSquare, Award, TrendingUp, Users, Calendar, Star } from 'lucide-react';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const ProfessionalActivity = () => {
  const { tasks, projects } = useTask();
  const { user } = useAuth();

  if (!user) return null;

  // Generate professional activity feed
  const userTasks = tasks
    .filter(task => task.userId === user.id || task.assignedToId === user.id)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 5);

  // Mock professional activities
  const professionalActivities = [
    {
      type: "achievement",
      title: "Quarterly Performance Review Completed",
      description: "Achieved 95% of set objectives for Q1 2024",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      icon: Award,
      color: "text-yellow-600",
      badge: "Achievement"
    },
    {
      type: "milestone",
      title: "Project Alpha Milestone Reached",
      description: "Successfully delivered Phase 1 ahead of schedule",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      icon: TrendingUp,
      color: "text-green-600",
      badge: "Milestone"
    },
    {
      type: "collaboration",
      title: "Cross-Team Workshop Facilitated",
      description: "Led knowledge sharing session with Marketing team",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      icon: Users,
      color: "text-blue-600",
      badge: "Collaboration"
    },
    {
      type: "training",
      title: "Leadership Training Completed",
      description: "Completed Advanced Leadership Skills certification",
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      icon: Star,
      color: "text-purple-600",
      badge: "Development"
    }
  ];

  // Combine task activities with professional activities
  const taskActivities = userTasks.map(task => ({
    type: "task",
    title: `Task ${task.status === 'Completed' ? 'Completed' : 'Updated'}: ${task.title}`,
    description: task.description || "No description available",
    date: new Date(task.updatedAt || task.createdAt),
    icon: CheckSquare,
    color: task.status === 'Completed' ? "text-green-600" : "text-blue-600",
    badge: task.status
  }));

  const allActivities = [...professionalActivities, ...taskActivities]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8);

  const getActivityIcon = (activity: any) => {
    return <activity.icon className={`h-4 w-4 ${activity.color}`} />;
  };

  const getStatusColor = (badge: string) => {
    switch (badge.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'achievement':
        return 'destructive';
      case 'milestone':
        return 'default';
      case 'collaboration':
        return 'secondary';
      case 'development':
        return 'outline';
      case 'in progress':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Professional Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {allActivities.length > 0 ? (
            allActivities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="mt-1">
                  {getActivityIcon(activity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{activity.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(activity.date, 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(activity.badge)} className="text-xs">
                      {activity.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {activity.description}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recent professional activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfessionalActivity;
