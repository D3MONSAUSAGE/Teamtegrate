
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import AddTeamMemberDialog from '@/components/AddTeamMemberDialog';
import TeamStatsCards from '@/components/team/TeamStatsCards';
import TeamMemberCard from '@/components/team/TeamMemberCard';
import NoTeamMembers from '@/components/team/NoTeamMembers';
import useTeamMembers from '@/hooks/useTeamMembers';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from "@/hooks/use-mobile";

const TeamPage = () => {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const {
    teamMembersPerformance,
    teamMembersCount,
    totalTasksAssigned,
    totalTasksCompleted,
    projectsCount,
    removeTeamMember,
    refreshTeamMembers,
    isLoading,
  } = useTeamMembers();
  
  const handleRemoveMember = async (memberId: string) => {
    setRemovingMemberId(memberId);
    await removeTeamMember(memberId);
    setRemovingMemberId(null);
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Please log in to manage your team.</p>
      </div>
    );
  }
  
  return (
    <div className={`p-3 sm:p-6`}>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Team Management</h1>
        <Button onClick={() => setIsAddMemberOpen(true)} disabled={isLoading} size={isMobile ? "sm" : "default"}>
          <Plus className="h-4 w-4 mr-2" /> Add Team Member
        </Button>
      </div>
      
      <TeamStatsCards 
        teamMembersCount={teamMembersCount}
        totalTasks={totalTasksAssigned}
        completedTasks={totalTasksCompleted}
        projectsCount={projectsCount}
      />
      
      <h2 className="text-xl font-semibold mb-4">Team Members</h2>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-500">Loading team members...</span>
        </div>
      ) : teamMembersCount === 0 ? (
        <NoTeamMembers onAddMember={() => setIsAddMemberOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {teamMembersPerformance.map((member) => (
            <TeamMemberCard 
              key={member.id} 
              member={member}
              onRemove={handleRemoveMember}
              isRemoving={removingMemberId === member.id}
            />
          ))}
        </div>
      )}
      
      <AddTeamMemberDialog 
        open={isAddMemberOpen}
        onOpenChange={setIsAddMemberOpen}
        onTeamMemberAdded={refreshTeamMembers}
      />
    </div>
  );
};

export default TeamPage;
