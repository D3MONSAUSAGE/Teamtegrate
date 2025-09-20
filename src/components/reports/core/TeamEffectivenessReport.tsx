import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Trophy, Clock, Target } from 'lucide-react';

interface TeamEffectivenessData {
  team_id: string;
  team_name: string;
  member_count: number;
  total_tasks: number;
  completed_tasks: number;
  avg_completion_time: number;
  collaboration_score: number;
}

interface TeamEffectivenessReportProps {
  data: TeamEffectivenessData[];
  isLoading: boolean;
}

export const TeamEffectivenessReport: React.FC<TeamEffectivenessReportProps> = ({
  data,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Team Data Available</h3>
          <p className="text-muted-foreground">No teams have been assigned tasks in the selected period.</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall metrics
  const totalTeams = data.length;
  const totalTasks = data.reduce((sum, team) => sum + team.total_tasks, 0);
  const totalCompleted = data.reduce((sum, team) => sum + team.completed_tasks, 0);
  const avgCollaboration = data.length > 0 
    ? Math.round(data.reduce((sum, team) => sum + team.collaboration_score, 0) / data.length)
    : 0;

  // Find top performer
  const topTeam = data.reduce((best, team) => 
    team.collaboration_score > best.collaboration_score ? team : best,
    { collaboration_score: 0, team_name: 'N/A' }
  );

  // Prepare chart data
  const chartData = data
    .sort((a, b) => b.collaboration_score - a.collaboration_score)
    .slice(0, 10) // Top 10 teams
    .map(team => ({
      ...team,
      completion_rate: team.total_tasks > 0 
        ? Math.round((team.completed_tasks / team.total_tasks) * 100)
        : 0
    }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Teams</p>
                <p className="text-2xl font-bold text-foreground">{totalTeams}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold text-foreground">{totalTasks}</p>
                <Badge variant="secondary" className="text-xs mt-1">
                  {totalCompleted} completed
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Team</p>
                <p className="text-lg font-bold text-foreground truncate">{topTeam.team_name}</p>
                <Badge variant="default" className="text-xs mt-1">
                  {topTeam.collaboration_score}% score
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Collaboration</p>
                <p className="text-2xl font-bold text-foreground">{avgCollaboration}%</p>
                <Badge 
                  variant={avgCollaboration >= 80 ? "default" : "secondary"}
                  className="text-xs mt-1"
                >
                  {avgCollaboration >= 80 ? 'Excellent' : avgCollaboration >= 60 ? 'Good' : 'Needs Work'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="team_name" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'completion_rate' ? `${value}%` : value,
                  name === 'completion_rate' ? 'Completion Rate' : 'Collaboration Score'
                ]}
              />
              <Bar dataKey="completion_rate" fill="hsl(var(--primary))" name="completion_rate" />
              <Bar dataKey="collaboration_score" fill="hsl(var(--secondary))" name="collaboration_score" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Team Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Total Tasks</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Completion Rate</TableHead>
                <TableHead>Collaboration Score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data
                .sort((a, b) => b.collaboration_score - a.collaboration_score)
                .map((team) => {
                  const completionRate = team.total_tasks > 0 
                    ? Math.round((team.completed_tasks / team.total_tasks) * 100)
                    : 0;
                  
                  return (
                    <TableRow key={team.team_id}>
                      <TableCell className="font-medium">{team.team_name}</TableCell>
                      <TableCell>{team.member_count || 'N/A'}</TableCell>
                      <TableCell>{team.total_tasks}</TableCell>
                      <TableCell>{team.completed_tasks}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={completionRate} className="w-16 h-2" />
                          <span className="text-sm">{completionRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{team.collaboration_score}%</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            team.collaboration_score >= 80 ? "default" :
                            team.collaboration_score >= 60 ? "secondary" : "outline"
                          }
                        >
                          {team.collaboration_score >= 80 ? 'Excellent' :
                           team.collaboration_score >= 60 ? 'Good' : 'Needs Focus'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};