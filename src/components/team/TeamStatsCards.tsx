
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

interface TeamStatsCardsProps {
  teamMembersCount: number;
  totalTasks: number;
  completedTasks: number;
  projectsCount: number;
}

const TeamStatsCards: React.FC<TeamStatsCardsProps> = ({ 
  teamMembersCount, 
  totalTasks, 
  completedTasks, 
  projectsCount 
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
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className={`${isMobile ? 'p-3' : 'pb-2'}`}>
          <CardTitle className="text-xs sm:text-sm font-medium">Completed</CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'p-3 pt-0' : undefined}>
          <div className="text-xl sm:text-2xl font-bold">{completedTasks}</div>
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
