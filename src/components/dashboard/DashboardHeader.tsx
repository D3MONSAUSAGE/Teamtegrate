
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardHeaderProps {
  userName: string | undefined;
  onCreateTask: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isLoading: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName,
  onCreateTask,
  onRefresh,
  isRefreshing,
  isLoading,
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Welcome, {userName}!</h1>
        <p className="text-sm md:text-base text-gray-600">
          {format(new Date(), "EEEE, MMMM d")} · Here's your overview
        </p>
      </div>
      <div className="flex gap-2 self-start sm:self-auto">
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"}
          onClick={onRefresh}
          disabled={isRefreshing || isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} /> 
          Refresh
        </Button>
        <Button 
          onClick={onCreateTask} 
          size={isMobile ? "sm" : "default"}
        >
          <Plus className="h-4 w-4 mr-2" /> New Task
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
