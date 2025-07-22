
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardHeaderProps {
  onCreateTask: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onCreateTask }) => {
  const { user } = useAuth();

  const handleCreateTaskClick = () => {
    console.log('DashboardHeader: Create task button clicked');
    onCreateTask();
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your projects today.
        </p>
      </div>
      
      <Button 
        onClick={handleCreateTaskClick}
        size="lg"
        className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <Plus className="h-4 w-4" />
        Add Task
      </Button>
    </div>
  );
};

export default DashboardHeader;
