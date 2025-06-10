
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppUser } from '@/types';

interface AssignedMemberCardProps {
  user: AppUser;
  onRemove: (userId: string) => void;
  getUserInitials: (name: string) => string;
  getUserStatus: (userId: string) => string;
  getStatusColor: (status: string) => string;
}

const AssignedMemberCard: React.FC<AssignedMemberCardProps> = ({
  user,
  onRemove,
  getUserInitials,
  getUserStatus,
  getStatusColor
}) => {
  const status = getUserStatus(user.id);

  return (
    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-lg border border-blue-200/30">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              {getUserInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
            getStatusColor(status)
          )} />
        </div>
        <div>
          <div className="font-medium text-sm">{user.name}</div>
          <div className="text-xs text-muted-foreground capitalize">{status}</div>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemove(user.id)}
        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default AssignedMemberCard;
