
import React from 'react';
import { useTask } from '@/contexts/task';
import useTeamMembers from '@/hooks/useTeamMembers';
import TeamPerformanceBarChart from './team/TeamPerformanceBarChart';
import TeamSkillMatrix from './team/TeamSkillMatrix';
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
  
  // Team member skill matrix (simulated data)
  const skillMatrixData = React.useMemo(() => {
    return teamMembersPerformance.slice(0, 5).map(member => ({
      subject: member.name,
      A: Math.round(Math.random() * 50) + 50, // Task completion
      B: Math.round(Math.random() * 40) + 60, // Communication
      C: Math.round(Math.random() * 30) + 70, // Collaboration
      D: Math.round(Math.random() * 50) + 50, // Technical skills
      E: Math.round(Math.random() * 40) + 60  // Problem solving
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TeamSkillMatrix skillMatrixData={skillMatrixData} />
        <TeamProductivityTrend 
          productivityTrend={productivityTrend}
          teamMembers={teamMembersPerformance}
        />
      </div>
      
      <TeamRankingsTable teamMembersPerformance={teamMembersPerformance} />
    </div>
  );
};

export default TeamReports;
