
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";

interface TeamPageHeaderProps {
  onAddMember: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const TeamPageHeader: React.FC<TeamPageHeaderProps> = ({
  onAddMember,
  onRefresh,
  isLoading
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
      <h1 className="text-xl sm:text-2xl font-bold">Team Management</h1>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"}
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> 
          Refresh
        </Button>
        <Button 
          onClick={onAddMember} 
          disabled={isLoading} 
          size={isMobile ? "sm" : "default"}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Team Member
        </Button>
      </div>
    </div>
  );
};

export default TeamPageHeader;
