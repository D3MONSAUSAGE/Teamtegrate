
import React, { useState } from 'react';
import { useTask } from '@/contexts/task';
import useTeamMembers from '@/hooks/useTeamMembers';
import TeamPerformanceBarChart from './team/TeamPerformanceBarChart';
import TeamProductivityTrend from './team/TeamProductivityTrend';
import TeamRankingsTable from './team/TeamRankingsTable';
import TeamSkillMatrix from './team/TeamSkillMatrix';
import { SkillMatrixData } from '@/types/performance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TeamReports: React.FC = () => {
  const { tasks } = useTask();
  const { 
    teamMembersPerformance, 
    weeklyTeamPerformance,
    memberPerformanceChartData,
    weeklyPerformanceChartData,
    weeklyStats,
    totalTasksAssigned,
    totalTasksCompleted,
    totalCompletionRate
  } = useTeamMembers();
  
  const [timeframe, setTimeframe] = useState<'all' | 'weekly'>('weekly');
  
  // Display data based on selected timeframe
  const displayData = timeframe === 'weekly' ? weeklyPerformanceChartData : memberPerformanceChartData;
  const displayMembers = timeframe === 'weekly' ? weeklyTeamPerformance : teamMembersPerformance;
  
  // Productivity trends (simulated)
  const productivityTrend = React.useMemo(() => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
    const data = [];
    
    for (const week of weeks) {
      const weekData: Record<string, any> = { name: week };
      
      // Add data for top 3 team members
      displayMembers.slice(0, 3).forEach(member => {
        weekData[member.name] = Math.floor(Math.random() * 20) + 5;
      });
      
      data.push(weekData);
    }
    
    return data;
  }, [displayMembers]);
  
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
      // Create a properly typed skill data object
      const data: SkillMatrixData = { 
        subject: skill,
        A: 0,
        B: 0,
        C: 0,
        D: 0,
        E: 0
      };
      
      // Add data for top 5 team members (or less if there are fewer)
      const topMembers = displayMembers.slice(0, 5);
      
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
  }, [displayMembers]);
  
  // Summary stats for the selected timeframe
  const summaryStats = timeframe === 'weekly' ? weeklyStats : {
    totalTasksAssigned,
    totalTasksCompleted,
    totalCompletionRate
  };
  
  return (
    <div className="space-y-6">
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <div>Team Performance - {timeframe === 'weekly' ? 'This Week' : 'All Time'}</div>
            <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as 'all' | 'weekly')} className="w-auto">
              <TabsList className="w-auto">
                <TabsTrigger value="weekly">This Week</TabsTrigger>
                <TabsTrigger value="all">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{summaryStats.totalTasksAssigned}</div>
                <div className="text-sm text-muted-foreground">Tasks Assigned</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{summaryStats.totalTasksCompleted}</div>
                <div className="text-sm text-muted-foreground">Tasks Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{summaryStats.totalCompletionRate}%</div>
                <div className="text-sm text-muted-foreground">Completion Rate</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      <TeamPerformanceBarChart memberPerformanceData={displayData} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamProductivityTrend 
          productivityTrend={productivityTrend}
          teamMembers={displayMembers}
        />
        
        <TeamSkillMatrix skillMatrixData={skillMatrixData} />
      </div>
      
      <TeamRankingsTable teamMembersPerformance={displayMembers} />
    </div>
  );
};

export default TeamReports;
