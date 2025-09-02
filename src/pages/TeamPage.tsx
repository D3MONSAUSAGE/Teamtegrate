
import React, { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AddTeamMemberDialog from '@/components/AddTeamMemberDialog';
import TeamStatsCards from '@/components/team/TeamStatsCards';
import TeamPageHeader from '@/components/team/TeamPageHeader';
import TeamPageContent from '@/components/team/TeamPageContent';
import TeamDebugPanel from '@/components/team/TeamDebugPanel';
import OrganizationHeader from '@/components/team/OrganizationHeader';
import useTeamMembers from '@/hooks/useTeamMembers';
import { useAuth } from '@/contexts/AuthContext';
import TeamOverviewDashboard from '@/components/team/overview/TeamOverviewDashboard';

const TeamPage = () => {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const { user } = useAuth();
  
  const {
    teamMembersPerformance,
    managerPerformance,
    unassignedTasks,
    teamMembersCount,
    totalTasksAssigned,
    totalTasksCompleted,
    teamTasksAssigned,
    managerTasksAssigned,
    unassignedTasksCount,
    projectsCount,
    removeTeamMember,
    refreshTeamMembers,
    isLoading: isTeamMembersLoading,
  } = useTeamMembers();

  const handleRemoveMember = async (memberId: string) => {
    setRemovingMemberId(memberId);
    await removeTeamMember(memberId);
    setRemovingMemberId(null);
  };

  const handleRefresh = async () => {
    console.log('Manual refresh triggered');
    await refreshTeamMembers();
    toast.success('Team data refreshed');
  };

  const handleReassignTask = (taskId: string) => {
    // TODO: Implement task reassignment functionality
    toast.info('Task reassignment feature coming soon');
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Please log in to manage your team.</p>
      </div>
    );
  }
  
  return (
    <div className="p-3 sm:p-6">
        {/* Replace the existing TeamPage content with TeamOverviewDashboard */}
        <TeamOverviewDashboard />
    </div>
  );
};

export default TeamPage;
