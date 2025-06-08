
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";

interface TeamStatsCardsProps {
  teamMembersCount: number;
  totalTasks: number;
  completedTasks: number;
  projectsCount: number;
  teamTasksAssigned?: number;
  managerTasksAssigned?: number;
  unassignedTasksCount?: number;
}

const TeamStatsCards: React.FC<TeamStatsCardsProps> = ({ 
  teamMembersCount, 
  totalTasks, 
  completedTasks, 
  projectsCount,
  teamTasksAssigned = 0,
  managerTasksAssigned = 0,
  unassignedTasksCount = 0
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-8">
      <Card>
        <CardHeader className={`${isMobile ? 'p-3' : 'pb-2'}`}>
          <CardTitle className="text-xs sm:text-sm font-medium">Team Members</CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'p-3 pt-0' : undefined}>
          <div className="text-xl sm:text-2xl font-bold">{teamMembersCount}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className={`${isMobile ? 'p-3' : 'pb-2'}`}>
          <CardTitle className="text-xs sm:text-sm font-medium">Tasks Assigned</CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'p-3 pt-0' : undefined}>
          <div className="text-xl sm:text-2xl font-bold">{totalTasks}</div>
          <div className="flex gap-1 mt-1 text-xs text-muted-foreground flex-wrap">
            <Badge variant="secondary" className="text-xs">
              Team: {teamTasksAssigned}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Manager: {managerTasksAssigned}
            </Badge>
            {unassignedTasksCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                Unassigned: {unassignedTasksCount}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className={`${isMobile ? 'p-3' : 'pb-2'}`}>
          <CardTitle className="text-xs sm:text-sm font-medium">Completed</CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'p-3 pt-0' : undefined}>
          <div className="text-xl sm:text-2xl font-bold">{completedTasks}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% completion rate
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className={`${isMobile ? 'p-3' : 'pb-2'}`}>
          <CardTitle className="text-xs sm:text-sm font-medium">Projects</CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'p-3 pt-0' : undefined}>
          <div className="text-xl sm:text-2xl font-bold">{projectsCount}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamStatsCards;
