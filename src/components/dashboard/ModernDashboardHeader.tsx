import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Bell, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ModernDashboardHeaderProps {
  onCreateTask: () => void;
}

const ModernDashboardHeader: React.FC<ModernDashboardHeaderProps> = ({ onCreateTask }) => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-12">
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
          className="hidden lg:flex items-center gap-2 border-border hover:bg-dashboard-card-hover transition-all duration-200"
        >
          <Search className="h-4 w-4" />
          Search tasks...
        </Button>
        
        <Button 
          variant="outline" 
          size="lg"
          className="p-3 border-border hover:bg-dashboard-card-hover transition-all duration-200"
        >
          <Bell className="h-5 w-5" />
        </Button>
        
        <Button 
          onClick={onCreateTask}
          size="lg"
          className="flex items-center gap-2 bg-dashboard-gradient hover:opacity-90 shadow-glow transition-all duration-200 text-white border-0"
        >
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>
    </div>
  );
};

export default ModernDashboardHeader;