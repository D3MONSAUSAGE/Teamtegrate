
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, FileText, Users, Target, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ModernQuickActionsProps {
  onCreateTask: () => void;
}

const ModernQuickActions: React.FC<ModernQuickActionsProps> = ({ onCreateTask }) => {
  const { isReady } = useAuth();

  const actions = [
    {
      title: 'New Task',
      icon: Plus,
      description: 'Create a new task',
      action: onCreateTask,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100'
    },
    {
      title: 'Schedule',
      icon: Calendar,
      description: 'View calendar',
      action: () => toast.info('Calendar would open here'),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100'
    },
    {
      title: 'Reports',
      icon: FileText,
      description: 'View reports',
      action: () => toast.info('Reports would open here'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100'
    },
    {
      title: 'Team',
      icon: Users,
      description: 'Manage team',
      action: () => toast.info('Team management would open here'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:bg-orange-100'
    }
  ];

  const handleAction = (action: () => void) => {
    if (!isReady) {
      toast.error('Please wait for your profile to load');
      return;
    }
    action();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="h-full"
    >
      <Card className="h-full border-0 bg-white shadow-sm ring-1 ring-slate-200/50">
        <CardHeader className="pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Target className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Quick Actions
              </CardTitle>
              <p className="text-xs text-slate-600 mt-0">
                Common tasks and shortcuts
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-2">
            {actions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Button
                  variant="ghost"
                  onClick={() => handleAction(action.action)}
                  className={`w-full h-auto p-3 flex flex-col items-center gap-1 ${action.bgColor} ${action.hoverColor} border border-slate-200/50 transition-all duration-200`}
                >
                  <div className="w-6 h-6 rounded-lg bg-white/60 flex items-center justify-center">
                    <action.icon className={`h-3 w-3 ${action.color}`} />
                  </div>
                  <span className="text-xs font-medium text-slate-900">{action.title}</span>
                </Button>
              </motion.div>
            ))}
          </div>
          
          {/* Quick Stats */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-slate-900">24</div>
                <div className="text-xs text-slate-600">Tasks Done</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-900">6.2h</div>
                <div className="text-xs text-slate-600">Time Logged</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ModernQuickActions;
