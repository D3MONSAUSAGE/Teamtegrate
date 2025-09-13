import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Target, TrendingUp, Award } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  completionRate: number;
  tasksCompleted: number;
  totalTasks: number;
  score: number;
  streak: number;
  rank: number;
}

interface TeamPerformanceData {
  teamName: string;
  teamId: string;
  overallCompletion: number;
  members: TeamMember[];
  averageScore: number;
  totalTasks: number;
  completedTasks: number;
}

interface TeamPerformanceComparisonProps {
  teams: TeamPerformanceData[];
}

export const TeamPerformanceComparison: React.FC<TeamPerformanceComparisonProps> = ({ teams }) => {
  const getPerformanceBadge = (rate: number) => {
    if (rate >= 95) return { variant: 'default' as const, text: 'Excellent', color: 'text-green-600' };
    if (rate >= 85) return { variant: 'secondary' as const, text: 'Good', color: 'text-blue-600' };
    if (rate >= 70) return { variant: 'outline' as const, text: 'Average', color: 'text-yellow-600' };
    return { variant: 'destructive' as const, text: 'Needs Focus', color: 'text-red-600' };
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Award className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Award className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Award className="h-4 w-4 text-orange-600" />;
    return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>;
  };

  const topPerformer = teams.length > 0 ? teams.reduce((prev, current) => 
    prev.overallCompletion > current.overallCompletion ? prev : current
  ) : null;

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => {
              const badge = getPerformanceBadge(team.overallCompletion);
              return (
                <div key={team.teamId} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{team.teamName}</h3>
                    <Badge variant={badge.variant}>{badge.text}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Completion Rate</span>
                      <span className="font-semibold">{team.overallCompletion.toFixed(1)}%</span>
                    </div>
                    <Progress value={team.overallCompletion} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Tasks</div>
                      <div className="font-semibold">{team.completedTasks}/{team.totalTasks}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Avg Score</div>
                      <div className="font-semibold">{team.averageScore.toFixed(1)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {team.members.length} members
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Individual Performance */}
      {teams.map((team) => (
        <Card key={team.teamId}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {team.teamName} - Individual Performance
              {topPerformer?.teamId === team.teamId && (
                <Badge variant="default" className="ml-2">
                  🏆 Top Team
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {team.members
                .sort((a, b) => b.completionRate - a.completionRate)
                .map((member) => (
                  <div key={member.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      {getRankIcon(member.rank)}
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {member.tasksCompleted}/{member.totalTasks} tasks
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold">{member.completionRate.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">completion</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold text-primary">{member.score.toFixed(1)}</div>
                        <div className="text-sm text-muted-foreground">score</div>
                      </div>

                      {member.streak > 0 && (
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="font-semibold text-green-600">{member.streak}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">streak</div>
                        </div>
                      )}
                    </div>

                    <div className="w-24">
                      <Progress value={member.completionRate} className="h-2" />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};