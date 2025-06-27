
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckSquare, FolderKanban, Users, Clock, TrendingUp, Target, Award, Calendar } from 'lucide-react';
import { useTask } from '@/contexts/task';
import useTeamMembers from '@/hooks/useTeamMembers';
import { useAuth } from '@/contexts/AuthContext';

const ProfessionalProfileStats = () => {
  const { tasks, projects } = useTask();
  const { user } = useAuth();
  const { teamMembersPerformance, managerPerformance } = useTeamMembers();

  if (!user) return null;

  // Calculate professional KPIs
  const userTasks = tasks.filter(task => task.userId === user.id || task.assignedToId === user.id);
  const completedTasks = userTasks.filter(task => task.status === 'Completed');
  const completionRate = userTasks.length > 0 ? Math.round((completedTasks.length / userTasks.length) * 100) : 0;
  
  const userProjects = projects.filter(project => 
    project.managerId === user.id || 
    project.teamMemberIds?.includes(user.id)
  );

  // Performance metrics
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const tasksThisMonth = userTasks.filter(task => 
    new Date(task.createdAt) >= thisMonth
  );
  const completedThisMonth = tasksThisMonth.filter(task => task.status === 'Completed');
  const monthlyPerformance = tasksThisMonth.length > 0 ? Math.round((completedThisMonth.length / tasksThisMonth.length) * 100) : 0;

  // Calculate average project timeline adherence
  const projectPerformance = userProjects.length > 0 ? 85 : 0; // Mock calculation

  const stats = [
    {
      title: "Overall Performance",
      value: `${completionRate}%`,
      description: `${completedTasks.length} of ${userTasks.length} tasks completed`,
      icon: Target,
      progress: completionRate,
      color: "text-blue-600",
      trend: "+5%"
    },
    {
      title: "Monthly Performance",
      value: `${monthlyPerformance}%`,
      description: `${completedThisMonth.length} tasks completed this month`,
      icon: TrendingUp,
      progress: monthlyPerformance,
      color: "text-green-600",
      trend: "+12%"
    },
    {
      title: "Active Projects",
      value: userProjects.length.toString(),
      description: user.role === 'manager' ? 'Managing projects' : 'Contributing to projects',
      icon: FolderKanban,
      color: "text-purple-600",
      progress: Math.min(userProjects.length * 25, 100)
    },
    {
      title: "Project Timeline",
      value: `${projectPerformance}%`,
      description: "On-time delivery rate",
      icon: Clock,
      progress: projectPerformance,
      color: "text-orange-600",
      trend: "+3%"
    },
    ...(user.role === 'manager' ? [{
      title: "Team Performance",
      value: teamMembersPerformance.length.toString(),
      description: "Team members managed",
      icon: Users,
      color: "text-indigo-600",
      progress: Math.min(teamMembersPerformance.length * 20, 100)
    }] : []),
    {
      title: "Goal Achievement",
      value: "92%",
      description: "Quarterly objectives met",
      icon: Award,
      progress: 92,
      color: "text-emerald-600",
      trend: "+8%"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Performance Dashboard</h2>
        <div className="text-sm text-muted-foreground">
          Updated: {new Date().toLocaleDateString()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                {stat.trend && (
                  <span className="text-xs text-green-600 font-medium">
                    {stat.trend}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              {stat.progress !== undefined && (
                <div className="mt-3">
                  <Progress value={stat.progress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProfessionalProfileStats;
