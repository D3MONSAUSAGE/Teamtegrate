
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TeamMemberPerformance {
  id: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  dueTodayTasks: number;
  projects: number;
}

interface TeamDebugPanelProps {
  showDebug: boolean;
  onToggleDebug: () => void;
  teamMembersCount: number;
  totalTasksAssigned: number;
  totalTasksCompleted: number;
  projectsCount: number;
  teamMembersPerformance: TeamMemberPerformance[];
}

const TeamDebugPanel: React.FC<TeamDebugPanelProps> = ({
  showDebug,
  onToggleDebug,
  teamMembersCount,
  totalTasksAssigned,
  totalTasksCompleted,
  projectsCount,
  teamMembersPerformance
}) => {
  return (
    <div className="mb-4">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onToggleDebug}
        className="text-xs"
      >
        {showDebug ? 'Hide' : 'Show'} Debug Info
      </Button>
      
      {showDebug && (
        <Card className="mt-2">
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div>Team Members Count: {teamMembersCount}</div>
            <div>Total Tasks Assigned: {totalTasksAssigned}</div>
            <div>Total Tasks Completed: {totalTasksCompleted}</div>
            <div>Projects Count: {projectsCount}</div>
            <div>Performance Data:</div>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(teamMembersPerformance.map(m => ({
                name: m.name,
                totalTasks: m.totalTasks,
                completedTasks: m.completedTasks,
                completionRate: m.completionRate,
                dueTodayTasks: m.dueTodayTasks,
                projects: m.projects
              })), null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeamDebugPanel;
