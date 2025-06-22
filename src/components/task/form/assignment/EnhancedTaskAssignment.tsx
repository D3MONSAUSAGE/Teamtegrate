
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
import OrganizationSelect from '@/components/ui/organization-select';
import TeamSelect from '@/components/ui/team-select';

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

  // Data hooks based on user role
  const { organizations, isLoading: loadingOrgs } = useOrganizations();
  const { teams, isLoading: loadingTeams } = useTeamsByOrganization(selectedOrganization);
  const { users: contextUsers, isLoading: loadingUsers } = useUsersByContext(
    selectedOrganization, 
    selectedTeam
  );

  // Initialize organization selection for super admin
  useEffect(() => {
    if (currentUser?.role === 'superadmin' && !selectedOrganization && currentUser.organizationId) {
      setSelectedOrganization(currentUser.organizationId);
    }
  }, [currentUser, selectedOrganization]);

  // Determine which users to show based on role and context
  const users = currentUser?.role === 'manager' ? fallbackUsers : contextUsers;
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
    setSelectedOrganization(orgId);
    setSelectedTeam(''); // Reset team selection
    onAssign("unassigned"); // Reset assignment
    onMembersChange([]); // Reset multi-assignment
  };

  const handleTeamChange = (teamId: string) => {
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
    <Card className="border-2 border-blue-100 h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5" />
          Task Assignment
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Organization Selection (Super Admin Only) */}
        {showOrganizationSelect && (
          <OrganizationSelect
            organizations={organizations}
            isLoading={loadingOrgs}
            selectedOrganization={selectedOrganization}
            onOrganizationChange={handleOrganizationChange}
          />
        )}

        {/* Team Selection (Super Admin & Admin) */}
        {showTeamSelect && (
          <TeamSelect
            teams={teams}
            isLoading={loadingTeams}
            selectedTeam={selectedTeam}
            onTeamChange={handleTeamChange}
            disabled={showOrganizationSelect && !selectedOrganization}
            optional={currentUser?.role === 'superadmin'}
          />
        )}

        {/* Assignment Toggle */}
        <AssignmentToggle
          multiAssignMode={multiAssignMode}
          onToggle={handleToggle}
        />

        {/* User Assignment */}
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

        {/* Context Info */}
        {(selectedOrganization || selectedTeam) && (
          <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
            {selectedOrganization && (
              <div>Organization: {organizations.find(o => o.id === selectedOrganization)?.name}</div>
            )}
            {selectedTeam && (
              <div>Team: {teams.find(t => t.id === selectedTeam)?.name}</div>
            )}
            <div>Available assignees: {users.length}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedTaskAssignment;
