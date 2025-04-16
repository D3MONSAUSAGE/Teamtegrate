
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import AddTeamMemberDialog from '@/components/AddTeamMemberDialog';
import TeamStatsCards from '@/components/team/TeamStatsCards';
import TeamMemberCard from '@/components/team/TeamMemberCard';
import NoTeamMembers from '@/components/team/NoTeamMembers';
import useTeamMembers from '@/hooks/useTeamMembers';

const TeamPage = () => {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const {
    teamMembersPerformance,
    teamMembersCount,
    totalTasksAssigned,
    totalTasksCompleted,
    projectsCount,
    removeTeamMember,
    refreshTeamMembers,
  } = useTeamMembers();
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <Button onClick={() => setIsAddMemberOpen(true)}>
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
      
      {teamMembersCount === 0 ? (
        <NoTeamMembers onAddMember={() => setIsAddMemberOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamMembersPerformance.map((member) => (
            <TeamMemberCard 
              key={member.id} 
              member={member}
              onRemove={removeTeamMember}
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
