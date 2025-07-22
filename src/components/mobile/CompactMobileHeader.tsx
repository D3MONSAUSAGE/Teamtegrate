
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Bell } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from 'date-fns';

interface CompactMobileHeaderProps {
  userName: string;
  onCreateTask: () => void;
  isLoading: boolean;
}

const CompactMobileHeader: React.FC<CompactMobileHeaderProps> = ({
  userName,
  onCreateTask,
  isLoading
}) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="bg-card/95 backdrop-blur-sm border-b border-border/50">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left side - User info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Hello, {userName.split(' ')[0]}
            </h1>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), "EEE, MMM d")}
            </p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Bell className="h-4 w-4" />
          </Button>
          <Button 
            onClick={onCreateTask}
            size="sm"
            className="h-8 px-3 bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isLoading}
          >
            <Plus className="h-3 w-3 mr-1" />
            Task
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompactMobileHeader;
