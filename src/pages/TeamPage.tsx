import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Users as UsersIcon, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddTeamMemberDialog from '@/components/AddTeamMemberDialog';
import TeamStatsCards from '@/components/team/TeamStatsCards';
import TeamMemberCard from '@/components/team/TeamMemberCard';
import ManagerPerformanceCard from '@/components/team/ManagerPerformanceCard';
import UnassignedTasksSection from '@/components/team/UnassignedTasksSection';
import NoTeamMembers from '@/components/team/NoTeamMembers';
import useTeamMembers from '@/hooks/useTeamMembers';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from "@/hooks/use-mobile";

const TeamPage = () => {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
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

  const { data: allUsers, isLoading: isUsersLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, avatar_url')
        .order('name');
      
      if (error) {
        toast.error('Failed to load users');
        throw error;
      }
      
      return data || [];
    }
  });

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
    <div className={`p-3 sm:p-6`}>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Team Management</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "default"}
            onClick={handleRefresh}
            disabled={isTeamMembersLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isTeamMembersLoading ? 'animate-spin' : ''}`} /> 
            Refresh
          </Button>
          <Button onClick={() => setIsAddMemberOpen(true)} disabled={isTeamMembersLoading} size={isMobile ? "sm" : "default"}>
            <Plus className="h-4 w-4 mr-2" /> Add Team Member
          </Button>
        </div>
      </div>
      
      <TeamStatsCards 
        teamMembersCount={teamMembersCount}
        totalTasks={totalTasksAssigned}
        completedTasks={totalTasksCompleted}
        projectsCount={projectsCount}
        teamTasksAssigned={teamTasksAssigned}
        managerTasksAssigned={managerTasksAssigned}
        unassignedTasksCount={unassignedTasksCount}
      />

      {/* Debug Panel */}
      <div className="mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowDebug(!showDebug)}
          className="text-xs"
        >
          {showDebug ? 'Hide' : 'Show'} Debug Info
        </Button>
        
        {showDebug && (
          <Card className="mt-2">
            <CardHeader>
              <CardTitle className="text-sm">Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div>Team Members Count: {teamMembersCount}</div>
              <div>Total Tasks Assigned: {totalTasksAssigned}</div>
              <div>Total Tasks Completed: {totalTasksCompleted}</div>
              <div>Projects Count: {projectsCount}</div>
              <div>Performance Data:</div>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(teamMembersPerformance.map(m => ({
                  name: m.name,
                  totalTasks: m.totalTasks,
                  completedTasks: m.completedTasks,
                  completionRate: m.completionRate,
                  dueTodayTasks: m.dueTodayTasks,
                  projects: m.projects
                })), null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Manager Performance Section */}
      {managerPerformance && managerPerformance.totalTasks > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4">Manager Performance</h2>
          <div className="mb-8">
            <ManagerPerformanceCard member={managerPerformance} />
          </div>
        </>
      )}
      
      <h2 className="text-xl font-semibold mb-4">Team Members</h2>
      
      {isTeamMembersLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-500">Loading team members...</span>
        </div>
      ) : teamMembersCount === 0 ? (
        <NoTeamMembers onAddMember={() => setIsAddMemberOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-4 mb-8">
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
      
      {/* Unassigned Tasks Section */}
      <UnassignedTasksSection 
        unassignedTasks={unassignedTasks}
        onReassignTask={handleReassignTask}
      />
      
      <h2 className="text-xl font-semibold mb-4 mt-8">All App Users</h2>
      <p className="text-sm text-muted-foreground mb-4">
        These are all users registered in the system. Add them as team members to assign tasks and collaborate.
      </p>
      
      {isUsersLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-500">Loading users...</span>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UsersIcon className="h-5 w-5 mr-2" /> 
              Total Users: {allUsers?.length || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {allUsers?.map((appUser) => (
                <div 
                  key={appUser.id} 
                  className="flex flex-col items-center text-center"
                >
                  <Avatar className="h-16 w-16 mb-2">
                    <AvatarImage 
                      src={appUser.avatar_url || undefined} 
                      alt={`${appUser.name}'s avatar`} 
                    />
                    <AvatarFallback>
                      {appUser.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{appUser.name}</p>
                    <p className="text-xs text-muted-foreground">{appUser.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
