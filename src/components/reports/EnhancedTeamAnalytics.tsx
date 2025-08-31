import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Target,
  Award,
  Activity
} from 'lucide-react';
import { TeamMembershipManager } from '@/components/team/TeamMembershipManager';
import { useTeamContext } from '@/hooks/useTeamContext';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  projects: number;
  recentActivity: Array<{
    date: string;
    tasksCompleted: number;
  }>;
  workloadScore: number;
  qualityScore: number;
  collaborationScore: number;
}

export const EnhancedTeamAnalytics: React.FC = () => {
  const teamContext = useTeamContext();
  const [sortBy, setSortBy] = useState<'completionRate' | 'totalTasks' | 'projects'>('completionRate');

  // Ensure context is available
  if (!teamContext) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Analytics</CardTitle>
          <CardDescription>Loading team context...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Initializing...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { selectedTeam } = teamContext;

  // Mock data - replace with actual team members data
  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      completedTasks: 15,
      totalTasks: 18,
      completionRate: 83,
      projects: 3,
      workloadScore: 75,
      qualityScore: 88,
      collaborationScore: 92,
      recentActivity: [
        { date: 'Dec 10', tasksCompleted: 3 },
        { date: 'Dec 11', tasksCompleted: 2 },
        { date: 'Dec 12', tasksCompleted: 4 },
        { date: 'Dec 13', tasksCompleted: 1 },
        { date: 'Dec 14', tasksCompleted: 3 },
        { date: 'Dec 15', tasksCompleted: 2 },
        { date: 'Dec 16', tasksCompleted: 5 },
      ]
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      completedTasks: 22,
      totalTasks: 25,
      completionRate: 88,
      projects: 4,
      workloadScore: 80,
      qualityScore: 92,
      collaborationScore: 85,
      recentActivity: [
        { date: 'Dec 10', tasksCompleted: 4 },
        { date: 'Dec 11', tasksCompleted: 3 },
        { date: 'Dec 12', tasksCompleted: 3 },
        { date: 'Dec 13', tasksCompleted: 2 },
        { date: 'Dec 14', tasksCompleted: 4 },
        { date: 'Dec 15', tasksCompleted: 3 },
        { date: 'Dec 16', tasksCompleted: 3 },
      ]
    },
  ];

  if (!selectedTeam) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Analytics</CardTitle>
            <CardDescription>Select a team to view detailed analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No team selected</p>
                <p className="text-sm text-muted-foreground">Choose a team from the selector above</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedMembers = [...teamMembers].sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{selectedTeam.name} Analytics</h2>
          <p className="text-muted-foreground">Performance insights and team metrics</p>
        </div>
        <Badge variant="outline">{teamMembers.length} members</Badge>
      </div>

      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground">Active contributors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(teamMembers.reduce((sum, m) => sum + m.completionRate, 0) / teamMembers.length)}%
            </div>
            <p className="text-xs text-muted-foreground">Team average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.reduce((sum, m) => sum + m.totalTasks, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {teamMembers.reduce((sum, m) => sum + m.completedTasks, 0)} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sortedMembers[0]?.name.split(' ')[0] || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {sortedMembers[0]?.completionRate}% completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Member Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Team Member Performance</CardTitle>
          <CardDescription>Individual performance metrics and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedMembers.map((member, index) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={undefined} />
                    <AvatarFallback>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.name}</p>
                      {index === 0 && (
                        <Badge variant="secondary">Top Performer</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Tasks</p>
                    <p className="font-medium">{member.completedTasks}/{member.totalTasks}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Projects</p>
                    <p className="font-medium">{member.projects}</p>
                  </div>
                  <div className="text-center min-w-[100px]">
                    <p className="text-sm text-muted-foreground">Completion</p>
                    <div className="flex items-center gap-2">
                      <Progress value={member.completionRate} className="w-16 h-2" />
                      <span className="text-sm font-medium">{member.completionRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Membership Management */}
      <TeamMembershipManager />
    </div>
  );
};