
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { User } from '@/types';

interface ProjectTeamMembersProps {
  members: User[];
  maxDisplay?: number;
}

const ProjectTeamMembers: React.FC<ProjectTeamMembersProps> = ({ 
  members, 
  maxDisplay = 3 
}) => {
  if (!members || members.length === 0) {
    return null;
  }

  // Limit the number of displayed members
  const displayedMembers = members.slice(0, maxDisplay);
  const additionalCount = members.length - maxDisplay;

  return (
    <TooltipProvider>
      <div className="flex -space-x-2 overflow-hidden">
        {displayedMembers.map((member) => (
          <Tooltip key={member.id}>
            <TooltipTrigger asChild>
              <Avatar className="h-6 w-6 border-2 border-background">
                <AvatarImage 
                  src={member.avatar_url || ''} 
                  alt={member.name || member.email || ''} 
                />
                <AvatarFallback className="text-xs">
                  {member.name ? member.name.charAt(0).toUpperCase() : 
                   member.email ? member.email.charAt(0).toUpperCase() : '?'}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{member.name || member.email}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {additionalCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium border-2 border-background">
                +{additionalCount}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{additionalCount} more team {additionalCount === 1 ? 'member' : 'members'}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ProjectTeamMembers;
