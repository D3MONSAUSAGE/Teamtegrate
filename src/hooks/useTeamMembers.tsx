
import { useState, useEffect } from 'react';
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TeamMember, TeamMemberPerformance } from '@/types/team';
import { PerformanceChartData } from '@/types/performance';
import { 
  calculateTeamMembersPerformance,
  generateMemberPerformanceChartData,
  calculateTeamSummaryStats,
  getWeeklyTeamPerformance
} from '@/utils/teamPerformanceUtils';

const useTeamMembers = () => {
  const { tasks, projects } = useTask();
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load team members from Supabase on hook initialization
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('manager_id', user.id);

        if (error) {
          throw error;
        }

        // Transform the data to match our TeamMember interface
        const formattedMembers: TeamMember[] = data.map((member) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          managerId: member.manager_id
        }));

        setTeamMembers(formattedMembers);
      } catch (error) {
        console.error('Error loading team members:', error);
        toast.error('Failed to load team members');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTeamMembers();
  }, [user]);
  
  // Function to remove a team member
  const removeTeamMember = async (memberId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)
        .eq('manager_id', user.id);

      if (error) {
        throw error;
      }

      setTeamMembers((prev) => prev.filter((member) => member.id !== memberId));
      toast.success('Team member removed successfully');
    } catch (error) {
      console.error('Error removing team member:', error);
      toast.error('Failed to remove team member');
    }
  };
  
  // Function to refresh team members list
  const refreshTeamMembers = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('manager_id', user.id);

      if (error) {
        throw error;
      }

      // Transform the data to match our TeamMember interface
      const formattedMembers: TeamMember[] = data.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        managerId: member.manager_id
      }));

      setTeamMembers(formattedMembers);
    } catch (error) {
      console.error('Error refreshing team members:', error);
      toast.error('Failed to refresh team members');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate team members performance using the utility function
  const teamMembersPerformance: TeamMemberPerformance[] = calculateTeamMembersPerformance(teamMembers, tasks);
  
  // Calculate weekly team performance
  const weeklyTeamPerformance: TeamMemberPerformance[] = getWeeklyTeamPerformance(teamMembers, tasks);
  
  // Generate chart data using the utility function for overall performance
  const memberPerformanceChartData: PerformanceChartData[] = generateMemberPerformanceChartData(teamMembersPerformance);
  
  // Generate chart data for weekly performance
  const weeklyPerformanceChartData: PerformanceChartData[] = generateMemberPerformanceChartData(weeklyTeamPerformance);
  
  // Calculate summary statistics using the utility function
  const { totalTasksAssigned, totalTasksCompleted, totalCompletionRate } = calculateTeamSummaryStats(teamMembersPerformance);
  
  // Calculate weekly summary statistics
  const weeklyStats = calculateTeamSummaryStats(weeklyTeamPerformance);
  
  return {
    teamMembers,
    teamMembersPerformance,
    weeklyTeamPerformance,
    memberPerformanceChartData,
    weeklyPerformanceChartData,
    isLoading,
    removeTeamMember,
    refreshTeamMembers,
    totalTasksAssigned,
    totalTasksCompleted,
    totalCompletionRate,
    weeklyStats,
    teamMembersCount: teamMembers.length,
    projectsCount: projects.length,
  };
};

export default useTeamMembers;
