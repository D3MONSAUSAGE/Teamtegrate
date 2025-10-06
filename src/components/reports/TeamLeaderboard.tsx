import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Users, TrendingUp } from 'lucide-react';
import type { TaskTeamPerformance } from '@/hooks/useTaskTeamPerformance';

interface TeamLeaderboardProps {
  teams: TaskTeamPerformance[];
}

export const TeamLeaderboard: React.FC<TeamLeaderboardProps> = ({ teams }) => {
  const sortedTeams = [...teams].sort((a, b) => b.team_score - a.team_score);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Trophy className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground">#{index + 1}</span>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Team Performance Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-center">Members</TableHead>
              <TableHead className="text-center">Tasks</TableHead>
              <TableHead className="text-center">Velocity</TableHead>
              <TableHead className="text-center">Balance</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTeams.map((team, index) => (
              <TableRow key={team.team_id}>
                <TableCell className="font-medium">
                  <div className="flex items-center justify-center">
                    {getRankIcon(index)}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{team.team_name}</div>
                    <div className="text-xs text-muted-foreground">
                      Top: {team.top_performer_name}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{team.member_count}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="text-sm">
                    <div className="font-medium">{team.completed_tasks}/{team.total_tasks}</div>
                    <div className="text-xs text-muted-foreground">
                      {team.avg_completion_rate.toFixed(1)}%
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{team.team_velocity}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={team.workload_balance_score >= 75 ? 'default' : 'outline'}>
                    {team.workload_balance_score.toFixed(0)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(team.team_score)}`}>
                    {team.team_score.toFixed(1)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
