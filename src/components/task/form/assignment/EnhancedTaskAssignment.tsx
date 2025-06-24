
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, User as UserIcon, Building2 } from 'lucide-react';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useTeamsByOrganization } from '@/hooks/useTeamsByOrganization';
import { useUsersByContext } from '@/hooks/useUsersByContext';
import AssignmentToggle from './AssignmentToggle';
import TaskAssigneeSelect from '../TaskAssigneeSelect';
import TeamAssignmentCard from '../../TeamAssignmentCard';
import AssignmentSummary from './AssignmentSummary';
import OrganizationSelector from '@/components/organization/OrganizationSelector';
import TeamSelect from '@/components/ui/team-select';
import AssignmentErrorBoundary from './AssignmentErrorBoundary';

interface EnhancedTaskAssignmentProps {
  selectedMember?: string;
  selectedMembers: string[];
  onAssign: (userId: string) => void;
  onMembersChange: (memberIds: string[]) => void;
  users: User[];
  isLoading: boolean;
  editingTask?: any;
}

const EnhancedTaskAssignment: React.FC<EnhancedTaskAssignmentProps> = ({
  selectedMember,
  selectedMembers,
  onAssign,
  onMembersChange,
  users: fallbackUsers,
  isLoading: fallbackLoading,
  editingTask
}) => {
  const { user: currentUser } = useAuth();
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  // Determine initial mode based on existing assignment
  const [multiAssignMode, setMultiAssignMode] = useState(
    editingTask?.assignedToIds?.length > 1 || selectedMembers.length > 1
  );

  // Data hooks based on user role - with safe defaults
  const { organizations = [], isLoading: loadingOrgs } = useOrganizations();
  const { teams = [], isLoading: loadingTeams } = useTeamsByOrganization(selectedOrganization);
  const { users: contextUsers = [], isLoading: loadingUsers } = useUsersByContext(
    selectedOrganization, 
    selectedTeam === 'all' ? undefined : selectedTeam
  );

  // Enhanced initialization for superadmins
  useEffect(() => {
    if (currentUser?.role === 'superadmin') {
      // Auto-select current user's organization if not selected
      if (!selectedOrganization && currentUser.organizationId) {
        console.log('Auto-selecting superadmin organization:', currentUser.organizationId);
        setSelectedOrganization(currentUser.organizationId);
      }
    }
  }, [currentUser, selectedOrganization]);

  // Log user loading for debugging
  useEffect(() => {
    console.log('EnhancedTaskAssignment: User data state', {
      currentUserRole: currentUser?.role,
      selectedOrganization,
      selectedTeam,
      contextUsersCount: contextUsers.length,
      fallbackUsersCount: fallbackUsers.length,
      loadingUsers,
      fallbackLoading,
      organizationsCount: organizations.length,
      teamsCount: teams.length
    });
  }, [currentUser?.role, selectedOrganization, selectedTeam, contextUsers.length, fallbackUsers.length, loadingUsers, fallbackLoading, organizations.length, teams.length]);

  // Determine which users to show based on role and context - with safe fallbacks
  const users = Array.isArray(currentUser?.role === 'manager' ? fallbackUsers : contextUsers) 
    ? (currentUser?.role === 'manager' ? fallbackUsers : contextUsers)
    : [];
  const isLoading = currentUser?.role === 'manager' ? fallbackLoading : loadingUsers;

  const handleToggle = (enabled: boolean) => {
    setMultiAssignMode(enabled);
    
    if (enabled) {
      // Switch to multi-assign: keep current selection if single user is selected
      if (selectedMember && selectedMember !== "unassigned") {
        onMembersChange([selectedMember]);
      }
      onAssign("unassigned"); // Clear single assignment
    } else {
      // Switch to single assign: take first user from multi-assignment
      if (selectedMembers.length > 0) {
        onAssign(selectedMembers[0]);
      }
      onMembersChange([]); // Clear multi assignment
    }
  };

  const handleOrganizationChange = (orgId: string) => {
    console.log('Organization changed to:', orgId);
    setSelectedOrganization(orgId);
    setSelectedTeam(''); // Reset team selection
    onAssign("unassigned"); // Reset assignment
    onMembersChange([]); // Reset multi-assignment
  };

  const handleTeamChange = (teamId: string) => {
    console.log('Team changed to:', teamId);
    setSelectedTeam(teamId);
    onAssign("unassigned"); // Reset assignment
    onMembersChange([]); // Reset multi-assignment
  };

  const selectedUsers = users.filter(user => selectedMembers.includes(user.id));

  const handleUsersChange = (newUsers: User[]) => {
    onMembersChange(newUsers.map(u => u.id));
  };

  const showOrganizationSelect = currentUser?.role === 'superadmin';
  const showTeamSelect = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';

  return (
    <AssignmentErrorBoundary>
      <Card className="border-2 border-blue-100 h-fit">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            Task Assignment
            {users.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({users.length} available)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Organization Selection (Super Admin Only) */}
          {showOrganizationSelect && (
            <AssignmentErrorBoundary>
              <OrganizationSelector
                organizations={organizations || []}
                isLoading={loadingOrgs}
                selectedOrganization={selectedOrganization}
                onOrganizationChange={handleOrganizationChange}
                label="Select Organization"
                placeholder="Choose organization for task assignment"
              />
            </AssignmentErrorBoundary>
          )}

          {/* Team Selection (Super Admin & Admin) */}
          {showTeamSelect && (
            <AssignmentErrorBoundary>
              <TeamSelect
                teams={teams || []}
                isLoading={loadingTeams}
                selectedTeam={selectedTeam}
                onTeamChange={handleTeamChange}
                disabled={showOrganizationSelect && !selectedOrganization}
                optional={currentUser?.role === 'superadmin'}
              />
            </AssignmentErrorBoundary>
          )}

          {/* Assignment Toggle */}
          <AssignmentToggle
            multiAssignMode={multiAssignMode}
            onToggle={handleToggle}
          />

          {/* User Assignment */}
          <AssignmentErrorBoundary>
            {multiAssignMode ? (
              <div className="space-y-4">
                <TeamAssignmentCard
                  selectedUsers={selectedUsers}
                  setSelectedUsers={handleUsersChange}
                  users={users}
                  loadingUsers={isLoading}
                />
                <AssignmentSummary selectedMembersCount={selectedMembers.length} />
              </div>
            ) : (
              <TaskAssigneeSelect
                selectedMember={selectedMember || "unassigned"}
                onAssign={onAssign}
                users={users}
                isLoading={isLoading}
              />
            )}
          </AssignmentErrorBoundary>

          {/* Context Info */}
          {(selectedOrganization || selectedTeam) && (
            <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
              {selectedOrganization && (
                <div>Organization: {organizations.find(o => o.id === selectedOrganization)?.name || 'Unknown'}</div>
              )}
              {selectedTeam && selectedTeam !== 'all' && (
                <div>Team: {teams.find(t => t.id === selectedTeam)?.name || 'Unknown'}</div>
              )}
              {selectedTeam === 'all' && (
                <div>Team: All Teams</div>
              )}
              <div>Available assignees: {users.length}</div>
            </div>
          )}

          {/* No Users Available Warning */}
          {!isLoading && users.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <UserIcon className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No users available for assignment</p>
              {showOrganizationSelect && !selectedOrganization && (
                <p className="text-xs mt-1">Select an organization to see available users</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </AssignmentErrorBoundary>
  );
};

export default EnhancedTaskAssignment;
