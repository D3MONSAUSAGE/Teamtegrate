
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
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
  return (
    <div className="bg-card/95 backdrop-blur-sm border-b border-border/50">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left side - User greeting only */}
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Hello, {userName.split(' ')[0]}
          </h1>
          <p className="text-xs text-muted-foreground">
            {format(new Date(), "EEE, MMM d")}
          </p>
        </div>

        {/* Right side - Just the add task button */}
        <div>
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
