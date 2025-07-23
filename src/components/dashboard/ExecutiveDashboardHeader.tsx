
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Bell, 
  Settings, 
  ChevronDown, 
  Plus, 
  Command,
  Filter,
  MoreHorizontal,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

interface ExecutiveDashboardHeaderProps {
  onCreateTask: () => void;
}

const ExecutiveDashboardHeader: React.FC<ExecutiveDashboardHeaderProps> = ({ onCreateTask }) => {
  const { user } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);

  const getCurrentTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const quickActions = [
    { label: 'New Task', icon: Plus, action: onCreateTask, primary: true },
    { label: 'Team', icon: Users, action: () => {} },
    { label: 'Calendar', icon: Calendar, action: () => {} },
    { label: 'Reports', icon: BarChart3, action: () => {} },
  ];

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/95 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Top Row - Main Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-8">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                <Command className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-slate-900">TaskFlow</h1>
                <p className="text-xs text-slate-500">Executive Dashboard</p>
              </div>
            </div>

            {/* Global Search */}
            <div className="relative flex-1 max-w-xl">
              <div className={`relative transition-all duration-300 ${searchFocused ? 'scale-105' : ''}`}>
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tasks, projects, team members..."
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="p-1">
                    <Filter className="h-3 w-3" />
                  </Button>
                  <kbd className="hidden sm:inline-flex items-center px-2 py-1 bg-slate-200 text-slate-500 text-xs rounded">
                    ⌘K
                  </kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Actions */}
            <div className="hidden lg:flex items-center gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={action.label}
                  onClick={action.action}
                  variant={action.primary ? "default" : "ghost"}
                  size="sm"
                  className={`flex items-center gap-2 transition-all duration-200 ${
                    action.primary 
                      ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg' 
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative p-2">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">3</span>
              </span>
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-5 w-5" />
            </Button>

            {/* Profile */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={user?.name || 'User'} />
                <AvatarFallback className="bg-slate-900 text-white text-sm">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500">{user?.role || 'Team Member'}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Bottom Row - Context & Breadcrumbs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {getCurrentTimeGreeting()}, {user?.name?.split(' ')[0] || 'User'}
              </h2>
              <p className="text-slate-600 mt-1">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })} • Here's your command center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
              All Systems Operational
            </Badge>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default ExecutiveDashboardHeader;
