import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { User } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email?: string;
}

interface TeamMemberSelectorProps {
  teamMembers: TeamMember[];
  selectedMember: string;
  onMemberChange: (memberId: string) => void;
  isLoading?: boolean;
}

export const TeamMemberSelector: React.FC<TeamMemberSelectorProps> = ({
  teamMembers,
  selectedMember,
  onMemberChange,
  isLoading = false
}) => {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <User className="h-4 w-4" />
        Select Team Member <span className="text-destructive">*</span>
      </Label>
      <Select value={selectedMember} onValueChange={onMemberChange} disabled={isLoading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={isLoading ? "Loading team members..." : "Choose a team member (required)"} />
        </SelectTrigger>
        <SelectContent>
          {teamMembers.length === 0 && !isLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No team members found
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