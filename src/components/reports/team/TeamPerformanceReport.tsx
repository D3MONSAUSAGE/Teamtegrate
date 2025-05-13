
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTeamPerformance } from '@/hooks/useTeamPerformance';
import { Progress } from '@/components/ui/progress';
import { Check, AlertCircle, Users } from 'lucide-react';

const TeamPerformanceReport = () => {
  const { teamPerformance, isLoading, error, refreshTeamPerformance } = useTeamPerformance();
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <div className="animate-pulse text-muted-foreground">Loading team performance data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <div className="text-destructive font-medium">Failed to load team performance data</div>
            <button 
              onClick={() => refreshTeamPerformance()}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (teamPerformance.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Users className="h-8 w-8 text-muted-foreground mb-2" />
            <div className="text-muted-foreground">No team performance data available</div>
            <div className="text-sm text-muted-foreground mt-1">
              Assign tasks to team members to see performance metrics
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Team Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamPerformance.map((member) => (
            <div key={member.id} className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="font-medium">{member.name}</div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium mr-1">{member.completedTasks}</span>
                  /
                  <span className="ml-1">{member.totalTasks} tasks</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Progress value={member.completionRate} className="flex-1 h-2" />
                <div className="w-10 text-xs font-medium">
                  {member.completionRate}%
                </div>
              </div>
              
              <div className="flex gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3" /> 
                  {member.completedTasks} completed
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> 
                  {member.projects} projects
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamPerformanceReport;
