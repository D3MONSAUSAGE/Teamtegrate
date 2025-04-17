
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Plus, AlertCircle, RefreshCw } from 'lucide-react';
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
    error
  } = useTeamMembers();
  
  // Debug information
  useEffect(() => {
    console.log("TeamPage rendering with user:", user);
    console.log("Team members count:", teamMembersCount);
    console.log("Is loading:", isLoading);
    console.log("Error:", error);
  }, [user, teamMembersCount, isLoading, error]);
  
  const handleRemoveMember = async (memberId: string) => {
    setRemovingMemberId(memberId);
    await removeTeamMember(memberId);
    setRemovingMemberId(null);
  };

  const handleRefresh = () => {
    refreshTeamMembers();
    toast.info("Refreshing team members");
  };

  // Force refresh on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshTeamMembers();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Please log in to manage your team.</p>
      </div>
    );
  }
  
  // Only managers can access the team page
  if (user.role !== 'manager') {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Only managers can access the team management page.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Your current role: {user.role || "Unknown"}
        </p>
        <Button onClick={handleRefresh} variant="outline" className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh Role
        </Button>
      </div>
    );
  }
  
  return (
    <div className={`p-3 sm:p-6`}>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Team Management</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "default"} 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={() => setIsAddMemberOpen(true)} disabled={isLoading} size={isMobile ? "sm" : "default"}>
            <Plus className="h-4 w-4 mr-2" /> Add Team Member
          </Button>
        </div>
      </div>
      
      <TeamStatsCards 
        teamMembersCount={teamMembersCount}
        totalTasks={totalTasksAssigned}
        completedTasks={totalTasksCompleted}
        projectsCount={projectsCount}
      />
      
      <h2 className="text-xl font-semibold mb-4">Team Members</h2>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-lg border">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span className="text-gray-500">Loading team members...</span>
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-white rounded-lg border">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-500 mb-4">Error loading team members: {error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      ) : teamMembersPerformance.length === 0 ? (
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
