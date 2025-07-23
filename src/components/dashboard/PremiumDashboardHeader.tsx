
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Bell, Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PremiumDashboardHeaderProps {
  onCreateTask: () => void;
}

const PremiumDashboardHeader: React.FC<PremiumDashboardHeaderProps> = ({ onCreateTask }) => {
  const { user, isReady, profileLoading } = useAuth();

  const handleCreateTask = () => {
    if (!isReady) {
      console.log('User not ready for task creation');
      return;
    }
    onCreateTask();
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-12 px-8 pt-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-dashboard-gradient bg-clip-text text-transparent">
          Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          Here's your productivity overview for today
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="lg"
          disabled={!isReady}
          className="hidden lg:flex items-center gap-2 border-border hover:bg-dashboard-card-hover transition-all duration-200 disabled:opacity-50"
        >
          <Search className="h-4 w-4" />
          Search tasks...
        </Button>
        
        <Button 
          variant="outline" 
          size="lg"
          disabled={!isReady}
          className="p-3 border-border hover:bg-dashboard-card-hover transition-all duration-200 disabled:opacity-50"
        >
          <Bell className="h-5 w-5" />
        </Button>
        
        <Button 
          onClick={handleCreateTask}
          size="lg"
          disabled={!isReady || profileLoading}
          className="flex items-center gap-2 bg-dashboard-gradient hover:opacity-90 shadow-glow transition-all duration-200 text-white border-0 disabled:opacity-50"
        >
          {profileLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          New Task
        </Button>
      </div>
    </div>
  );
};

export default PremiumDashboardHeader;
