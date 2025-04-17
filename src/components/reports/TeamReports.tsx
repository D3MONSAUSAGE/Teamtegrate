
import React from 'react';
import TeamPerformanceChart from './team/TeamPerformanceChart';
import TeamSkillMatrix from './team/TeamSkillMatrix';
import ProductivityTrendChart from './team/ProductivityTrendChart';
import TeamMemberRankings from './team/TeamMemberRankings';
import useTeamReportsData from './team/hooks/useTeamReportsData';

const TeamReports: React.FC = () => {
  const { 
    memberPerformanceData, 
    skillMatrixData, 
    productivityTrend,
    teamMembersPerformance
  } = useTeamReportsData();
  
  return (
    <div className="space-y-6">
      {/* Team Member Performance */}
      <TeamPerformanceChart memberPerformanceData={memberPerformanceData} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Member Skill Matrix */}
        <TeamSkillMatrix skillMatrixData={skillMatrixData} />
        
        {/* Team Productivity Trend */}
        <ProductivityTrendChart 
          productivityTrend={productivityTrend}
          teamMembersPerformance={teamMembersPerformance}
        />
      </div>
      
      {/* Team Member Rankings */}
      <TeamMemberRankings teamMembersPerformance={teamMembersPerformance} />
    </div>
  );
};

export default TeamReports;
