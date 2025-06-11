
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from '@/types';
import { X } from 'lucide-react';

interface AssignedMemberCardProps {
  user: User;
  onRemove: (userId: string) => void;
  showRemoveButton?: boolean;
}

const AssignedMemberCard: React.FC<AssignedMemberCardProps> = ({
  user,
  onRemove,
  showRemoveButton = true
}) => {
  return (
    <Card className="w-full">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback>
                {(user.name || user.email).substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user.name || user.email}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          {showRemoveButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(user.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignedMemberCard;
