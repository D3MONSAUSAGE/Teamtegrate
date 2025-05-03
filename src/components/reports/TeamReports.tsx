
import React from 'react';
import { useTask } from '@/contexts/task';
import useTeamMembers from '@/hooks/useTeamMembers';
import TeamPerformanceBarChart from './team/TeamPerformanceBarChart';
import TeamProductivityTrend from './team/TeamProductivityTrend';
import TeamRankingsTable from './team/TeamRankingsTable';
import TeamSkillMatrix from './team/TeamSkillMatrix';

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
  
  // Skill matrix data (simulated)
  const skillMatrixData = React.useMemo(() => {
    const skills = [
      'Task Execution',
      'Communication',
      'Collaboration',
      'Technical Skills',
      'Problem Solving'
    ];
    
    return skills.map(skill => {
      const data: Record<string, any> = { subject: skill };
      
      // Add data for top 5 team members (or less if there are fewer)
      const topMembers = teamMembersPerformance.slice(0, 5);
      
      // Add randomly generated skill scores for each member
      ['A', 'B', 'C', 'D', 'E'].forEach((key, index) => {
        if (index < topMembers.length) {
          // Generate a score between 50-90 for each skill
          data[key] = Math.floor(Math.random() * 40) + 50;
        } else {
          data[key] = 0; // No data for non-existent team members
        }
      });
      
      return data;
    });
  }, [teamMembersPerformance]);
  
  return (
    <div className="space-y-6">
      <TeamPerformanceBarChart memberPerformanceData={memberPerformanceData} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamProductivityTrend 
          productivityTrend={productivityTrend}
          teamMembers={teamMembersPerformance}
        />
        
        <TeamSkillMatrix skillMatrixData={skillMatrixData} />
      </div>
      
      <TeamRankingsTable teamMembersPerformance={teamMembersPerformance} />
    </div>
  );
};

export default TeamReports;
