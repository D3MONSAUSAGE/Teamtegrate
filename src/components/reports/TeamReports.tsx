
import React from 'react';
import { useTask } from '@/contexts/task';
import useTeamMembers from '@/hooks/useTeamMembers';
import TeamPerformanceBarChart from './team/TeamPerformanceBarChart';
import TeamProductivityTrend from './team/TeamProductivityTrend';
import TeamRankingsTable from './team/TeamRankingsTable';

const TeamReports: React.FC = () => {
  const { tasks } = useTask();
  const { teamMembersPerformance } = useTeamMembers();
  
  // Team member performance data
  const memberPerformanceData = React.useMemo(() => {
    return teamMembersPerformance.map(member => ({
      name: member.name,
      assignedTasks: member.totalTasks,
      completedTasks: member.completedTasks,
      completionRate: member.completionRate
    }));
  }, [teamMembersPerformance]);
  
  // Productivity trends (simulated)
  const productivityTrend = React.useMemo(() => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
    const data = [];
    
    for (const week of weeks) {
      const weekData: Record<string, any> = { name: week };
      
      // Add data for top 3 team members
      teamMembersPerformance.slice(0, 3).forEach(member => {
        weekData[member.name] = Math.floor(Math.random() * 20) + 5;
      });
      
      data.push(weekData);
    }
    
    return data;
  }, [teamMembersPerformance]);
  
  return (
    <div className="space-y-6">
      <TeamPerformanceBarChart memberPerformanceData={memberPerformanceData} />
      
      {/* Full width productivity trend */}
      <TeamProductivityTrend 
        productivityTrend={productivityTrend}
        teamMembers={teamMembersPerformance}
      />
      
      <TeamRankingsTable teamMembersPerformance={teamMembersPerformance} />
    </div>
  );
};

export default TeamReports;
