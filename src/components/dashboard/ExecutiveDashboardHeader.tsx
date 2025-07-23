
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Command
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

interface ExecutiveDashboardHeaderProps {
  onCreateTask: () => void;
}

const ExecutiveDashboardHeader: React.FC<ExecutiveDashboardHeaderProps> = ({ onCreateTask }) => {
  const { user } = useAuth();

  const getCurrentTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/95 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Top Row - Logo and New Task Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center shadow-lg">
              <Command className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-slate-900">TaskFlow</h1>
            </div>
          </div>

          <Button
            onClick={onCreateTask}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>

        {/* Bottom Row - Welcome Message */}
        <div className="flex items-center justify-between">
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
      </div>
    </motion.header>
  );
};

export default ExecutiveDashboardHeader;
