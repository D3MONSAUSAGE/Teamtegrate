
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Bell, Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface PremiumDashboardHeaderProps {
  onCreateTask: () => void;
}

const PremiumDashboardHeader: React.FC<PremiumDashboardHeaderProps> = ({ onCreateTask }) => {
  const { user, isReady, profileLoading } = useAuth();
  const navigate = useNavigate();

  const handleCreateTask = () => {
    if (!isReady) {
      toast.error('Please wait for your profile to load');
      return;
    }
    onCreateTask();
  };

  const handleSearch = () => {
    if (!isReady) {
      toast.error('Please wait for your profile to load');
      return;
    }
    toast.info('Search feature coming soon!');
  };

  const handleNotifications = () => {
    if (!isReady) {
      toast.error('Please wait for your profile to load');
      return;
    }
    toast.info('Notifications feature coming soon!');
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-12 px-8 pt-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">
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
          onClick={handleSearch}
          className="hidden lg:flex items-center gap-2 border-border hover:bg-accent transition-all duration-200 disabled:opacity-50"
        >
          <Search className="h-4 w-4" />
          Search tasks...
        </Button>
        
        <Button 
          variant="outline" 
          size="lg"
          disabled={!isReady}
          onClick={handleNotifications}
          className="p-3 border-border hover:bg-accent transition-all duration-200 disabled:opacity-50"
        >
          <Bell className="h-5 w-5" />
        </Button>
        
        <Button 
          onClick={handleCreateTask}
          size="lg"
          disabled={!isReady || profileLoading}
          className="flex items-center gap-2 bg-[hsl(var(--dashboard-success))] hover:bg-[hsl(var(--dashboard-success-hover))] text-[hsl(var(--dashboard-success-foreground))] border-0 shadow-[var(--shadow-glow)] transition-all duration-200 disabled:opacity-50"
        >
          {profileLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Create New Task
        </Button>
      </div>
    </div>
  );
};

export default PremiumDashboardHeader;
