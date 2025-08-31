import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { User } from 'lucide-react';
import { useRoleBasedUsers } from '@/hooks/useRoleBasedUsers';

interface TeamMember {
  id: string;
  name: string;
  email?: string;
}

interface TeamMemberSelectorProps {
  teamMembers?: TeamMember[]; // Made optional since we'll use the hook
  selectedMember: string;
  onMemberChange: (memberId: string) => void;
  isLoading?: boolean;
}

export const TeamMemberSelector: React.FC<TeamMemberSelectorProps> = ({
  teamMembers: propTeamMembers,
  selectedMember,
  onMemberChange,
  isLoading = false
}) => {
  // Use role-based users hook to get real data
  const { users: roleBasedUsers, isLoading: usersLoading, canViewTeamMembers } = useRoleBasedUsers();
  
  // Use prop team members if provided, otherwise use role-based users
  const teamMembers = propTeamMembers || roleBasedUsers.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email
  }));
  
  const isDataLoading = isLoading || usersLoading;
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <User className="h-4 w-4" />
        Select Team Member <span className="text-destructive">*</span>
      </Label>
      <Select value={selectedMember} onValueChange={onMemberChange} disabled={isDataLoading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={isDataLoading ? "Loading team members..." : canViewTeamMembers ? "Choose a team member (required)" : "Personal reports only"} />
        </SelectTrigger>
        <SelectContent>
          {isDataLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Loading team members...
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {canViewTeamMembers ? "No team members found" : "You can only view your own reports"}
            </div>
          ) : (
            teamMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                <div className="flex flex-col">
                  <span>{member.name}</span>
                  {member.email && (
                    <span className="text-xs text-muted-foreground">{member.email}</span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};