
import React from 'react';
import { useTask } from '@/contexts/task';
import useTeamMembers from '@/hooks/useTeamMembers';

export const useTeamReportsData = () => {
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
  
  // Task types distribution by team member
  const memberTaskCategoriesData = React.useMemo(() => {
    const categories = ['Development', 'Design', 'Planning', 'Testing', 'Documentation'];
    
    return teamMembersPerformance.slice(0, 5).map(member => {
      const data: Record<string, any> = { name: member.name };
      
      categories.forEach(category => {
        // Simulated data for task categories
        data[category] = Math.floor(Math.random() * member.totalTasks);
      });
      
      return data;
    });
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

  return {
    memberPerformanceData,
    skillMatrixData,
    memberTaskCategoriesData,
    productivityTrend,
    teamMembersPerformance
  };
};

export default useTeamReportsData;
