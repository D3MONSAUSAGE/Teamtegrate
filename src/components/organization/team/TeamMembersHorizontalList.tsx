import React from 'react';
import { Loader2, Users } from 'lucide-react';
import { useRealTeamMembers } from '@/hooks/team/useRealTeamMembers';
import TeamMemberMiniCard from './TeamMemberMiniCard';
import { cn } from "@/lib/utils";

interface TeamMembersHorizontalListProps {
  teamId: string;
  className?: string;
  maxDisplay?: number;
}

const TeamMembersHorizontalList: React.FC<TeamMembersHorizontalListProps> = ({ 
  teamId, 
  className,
  maxDisplay = 6
}) => {
  const { teamMembers, isLoading } = useRealTeamMembers(teamId);

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading members...</span>
      </div>
    );
  }

  if (!teamMembers || teamMembers.length === 0) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <Users className="h-4 w-4" />
        <span className="text-sm">No members assigned</span>
      </div>
    );
  }

  const displayedMembers = teamMembers.slice(0, maxDisplay);
  const remainingCount = teamMembers.length - maxDisplay;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Users className="h-3 w-3" />
        <span>Team Members ({teamMembers.length})</span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {displayedMembers.map((member) => (
          <TeamMemberMiniCard
            key={member.id}
            member={{
              id: member.id,
              name: member.name,
              email: member.email,
              role: member.role,
              avatar_url: member.avatar_url
            }}
            className="w-36"
          />
        ))}
        {remainingCount > 0 && (
          <div className="flex items-center justify-center p-2 bg-muted/50 border rounded-lg min-w-[80px] h-[47px]">
            <span className="text-xs text-muted-foreground font-medium">
              +{remainingCount} more
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamMembersHorizontalList;