
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckSquare, FolderKanban, Users, Clock } from 'lucide-react';
import { useTask } from '@/contexts/task';
import useTeamMembers from '@/hooks/useTeamMembers';
import { useAuth } from '@/contexts/AuthContext';

const ProfileStats = () => {
  const { tasks, projects } = useTask();
  const { user } = useAuth();
  const { teamMembersPerformance, managerPerformance } = useTeamMembers();

  if (!user) return null;

  // Calculate user's personal stats
  const userTasks = tasks.filter(task => task.userId === user.id || task.assignedToId === user.id);
  const completedTasks = userTasks.filter(task => task.status === 'Completed');
  const completionRate = userTasks.length > 0 ? Math.round((completedTasks.length / userTasks.length) * 100) : 0;
  
  // User's projects (as manager or team member)
  const userProjects = projects.filter(project => 
    project.managerId === user.id || 
    project.teamMemberIds?.includes(user.id)
  );

  // Tasks due today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueTodayTasks = userTasks.filter((task) => {
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });

  // Team size (if user is a manager)
  const teamSize = user.role === 'manager' ? teamMembersPerformance.length : 0;

  const stats = [
    {
      title: "Task Completion",
      value: `${completionRate}%`,
      description: `${completedTasks.length} of ${userTasks.length} tasks`,
      icon: CheckSquare,
      progress: completionRate,
      color: "text-green-600"
    },
    {
      title: "Active Projects",
      value: userProjects.length.toString(),
      description: user.role === 'manager' ? 'Managing projects' : 'Participating in projects',
      icon: FolderKanban,
      color: "text-blue-600"
    },
    {
      title: "Due Today",
      value: dueTodayTasks.length.toString(),
      description: "Tasks due today",
      icon: Clock,
      color: "text-orange-600"
    },
    ...(user.role === 'manager' ? [{
      title: "Team Size",
      value: teamSize.toString(),
      description: "Team members",
      icon: Users,
      color: "text-purple-600"
    }] : [])
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
            {stat.progress !== undefined && (
              <div className="mt-2">
                <Progress value={stat.progress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProfileStats;
