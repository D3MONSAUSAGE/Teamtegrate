
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  TrendingUp, 
  Award, 
  Star,
  ArrowRight,
  Activity,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Task, Project } from '@/types';
import { useOrganizationStats } from '@/hooks/useOrganizationStats';

interface TeamPerformanceOverviewProps {
  tasks: Task[];
  projects: Project[];
}

const TeamPerformanceOverview: React.FC<TeamPerformanceOverviewProps> = ({ tasks, projects }) => {
  const { stats } = useOrganizationStats();

  // Calculate team performance metrics
  const getTeamMetrics = () => {
    const teamMembers = Array.from(new Set(tasks.map(task => task.assignedToName).filter(Boolean)));
    
    const memberPerformance = teamMembers.map(member => {
      const memberTasks = tasks.filter(task => task.assignedToName === member);
      const completedTasks = memberTasks.filter(task => task.status === 'Completed');
      const completionRate = memberTasks.length > 0 ? (completedTasks.length / memberTasks.length) * 100 : 0;
      
      return {
        name: member,
        completedTasks: completedTasks.length,
        totalTasks: memberTasks.length,
        completionRate,
        recentActivity: memberTasks.filter(task => {
          const taskDate = new Date(task.updatedAt || task.createdAt);
          const daysDiff = (Date.now() - taskDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= 3;
        }).length
      };
    }).sort((a, b) => b.completionRate - a.completionRate);

    return memberPerformance.slice(0, 5);
  };

  const teamMetrics = getTeamMetrics();

  const overallStats = [
    {
      label: 'Active Members',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'text-dashboard-primary'
    },
    {
      label: 'Avg. Completion Rate',
      value: `${Math.round(teamMetrics.reduce((acc, member) => acc + member.completionRate, 0) / teamMetrics.length || 0)}%`,
      icon: TrendingUp,
      color: 'text-dashboard-success'
    },
    {
      label: 'Active Projects',
      value: stats?.active_projects || 0,
      icon: Activity,
      color: 'text-dashboard-teal'
    }
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-dashboard-success';
    if (rate >= 60) return 'text-dashboard-warning';
    return 'text-dashboard-error';
  };

  return (
    <Card className="border-0 shadow-base bg-dashboard-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-dashboard-teal/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-dashboard-teal" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-dashboard-gray-900">
                Team Performance
              </CardTitle>
              <p className="text-sm text-dashboard-gray-600">
                Real-time collaboration metrics
              </p>
            </div>
          </div>
          
          <Badge variant="secondary" className="bg-dashboard-teal/10 text-dashboard-teal">
            {teamMetrics.length} members
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-3 gap-4">
          {overallStats.map((stat) => (
            <div key={stat.label} className="text-center p-3 bg-dashboard-gray-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-lg font-bold text-dashboard-gray-900">{stat.value}</p>
              <p className="text-xs text-dashboard-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
        
        {/* Team Members */}
        <div className="space-y-3">
          <h4 className="font-medium text-dashboard-gray-900 flex items-center gap-2">
            <Award className="h-4 w-4 text-dashboard-warning" />
            Top Performers
          </h4>
          
          {teamMetrics.map((member, index) => (
            <div 
              key={member.name}
              className="flex items-center justify-between p-3 rounded-lg border border-dashboard-border hover:border-dashboard-primary/20 hover:bg-dashboard-card-hover transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt={member.name} />
                    <AvatarFallback className="bg-dashboard-primary/10 text-dashboard-primary font-medium">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-dashboard-warning rounded-full flex items-center justify-center">
                      <Star className="h-2 w-2 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="font-medium text-dashboard-gray-900">{member.name}</p>
                  <div className="flex items-center gap-3 text-xs text-dashboard-gray-600">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{member.completedTasks} completed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{member.recentActivity} recent</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`font-bold ${getPerformanceColor(member.completionRate)}`}>
                  {Math.round(member.completionRate)}%
                </p>
                <p className="text-xs text-dashboard-gray-600">completion</p>
              </div>
            </div>
          ))}
        </div>
        
        {teamMetrics.length === 0 && (
          <div className="text-center py-8 text-dashboard-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No team activity yet</p>
            <p className="text-sm">Invite team members to get started</p>
          </div>
        )}
        
        <div className="pt-4 border-t border-dashboard-border">
          <Button 
            variant="outline" 
            className="w-full border-dashboard-border hover:bg-dashboard-card-hover"
          >
            View Team Analytics
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamPerformanceOverview;
