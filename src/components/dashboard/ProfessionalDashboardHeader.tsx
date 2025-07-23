
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Bell, 
  Search, 
  Settings, 
  ChevronDown,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationStats } from '@/hooks/useOrganizationStats';

interface ProfessionalDashboardHeaderProps {
  onCreateTask: () => void;
}

const ProfessionalDashboardHeader: React.FC<ProfessionalDashboardHeaderProps> = ({ onCreateTask }) => {
  const { user } = useAuth();
  const { stats } = useOrganizationStats();

  const getCurrentTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getDateString = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const quickStats = [
    {
      label: 'Team Members',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'text-dashboard-primary'
    },
    {
      label: 'Active Projects',
      value: stats?.active_projects || 0,
      icon: TrendingUp,
      color: 'text-dashboard-teal'
    },
    {
      label: 'Tasks Due Today',
      value: stats?.total_tasks || 0,
      icon: Calendar,
      color: 'text-dashboard-purple'
    }
  ];

  return (
    <div className="bg-dashboard-card border-b border-dashboard-border">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Main Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-dashboard-gray-900">
                {getCurrentTimeGreeting()}, {user?.name?.split(' ')[0] || 'User'}
              </h1>
              <Badge 
                variant="secondary" 
                className="bg-dashboard-primary/10 text-dashboard-primary hover:bg-dashboard-primary/20 transition-colors"
              >
                {user?.role || 'User'}
              </Badge>
            </div>
            <p className="text-dashboard-gray-600 text-lg">
              {getDateString()} • Here's your executive dashboard
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="lg"
              className="hidden lg:flex items-center gap-2 border-dashboard-border hover:bg-dashboard-card-hover transition-all duration-200"
            >
              <Search className="h-4 w-4" />
              Search workspace...
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="p-3 border-dashboard-border hover:bg-dashboard-card-hover transition-all duration-200 relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-dashboard-error rounded-full"></span>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="p-3 border-dashboard-border hover:bg-dashboard-card-hover transition-all duration-200"
            >
              <Settings className="h-5 w-5" />
            </Button>
            
            <Button 
              onClick={onCreateTask}
              size="lg"
              className="flex items-center gap-2 bg-dashboard-primary hover:bg-dashboard-primary-dark shadow-lg hover:shadow-xl transition-all duration-200 text-dashboard-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickStats.map((stat, index) => (
            <div 
              key={stat.label}
              className="bg-dashboard-gray-50 rounded-lg p-4 border border-dashboard-border hover:border-dashboard-primary/20 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-dashboard-gray-600">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-dashboard-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-sm`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboardHeader;
