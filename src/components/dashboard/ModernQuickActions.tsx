
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  FolderPlus, 
  Calendar, 
  Users,
  FileText,
  Settings,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ModernQuickActionsProps {
  onCreateTask: () => void;
}

const ModernQuickActions: React.FC<ModernQuickActionsProps> = ({ onCreateTask }) => {
  const { isReady } = useAuth();
  const navigate = useNavigate();

  const primaryActions = [
    {
      title: 'Create Task',
      description: 'Add a new task to your workflow',
      icon: Plus,
      action: onCreateTask,
      gradient: 'from-blue-500 to-blue-600',
      hoverGradient: 'hover:from-blue-600 hover:to-blue-700'
    },
    {
      title: 'New Project',
      description: 'Start a new project initiative',
      icon: FolderPlus,
      action: () => {
        if (!isReady) {
          toast.error('Please wait for your profile to load');
          return;
        }
        navigate('/dashboard/projects');
      },
      gradient: 'from-emerald-500 to-emerald-600',
      hoverGradient: 'hover:from-emerald-600 hover:to-emerald-700'
    }
  ];

  const secondaryActions = [
    {
      title: 'Schedule Meeting',
      icon: Calendar,
      action: () => {
        if (!isReady) {
          toast.error('Please wait for your profile to load');
          return;
        }
        navigate('/dashboard/calendar');
      }
    },
    {
      title: 'Team Management',
      icon: Users,
      action: () => {
        if (!isReady) {
          toast.error('Please wait for your profile to load');
          return;
        }
        navigate('/dashboard/team');
      }
    },
    {
      title: 'View Reports',
      icon: FileText,
      action: () => {
        if (!isReady) {
          toast.error('Please wait for your profile to load');
          return;
        }
        navigate('/dashboard/reports');
      }
    },
    {
      title: 'Settings',
      icon: Settings,
      action: () => {
        if (!isReady) {
          toast.error('Please wait for your profile to load');
          return;
        }
        navigate('/dashboard/settings');
      }
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="h-full"
    >
      <Card className="h-full border-0 bg-white shadow-sm ring-1 ring-slate-200/50">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-sm">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Quick Actions
              </CardTitle>
              <p className="text-sm text-slate-600 mt-0.5">
                Frequently used features
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Primary Actions */}
            <div className="space-y-3">
              {primaryActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Button
                    onClick={action.action}
                    disabled={!isReady}
                    className={`w-full h-auto p-4 bg-gradient-to-r ${action.gradient} ${action.hoverGradient} text-white border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                        <action.icon className="h-5 w-5" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-base">{action.title}</div>
                        <div className="text-sm text-white/80 mt-0.5">{action.description}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 opacity-60" />
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Secondary Actions */}
            <div className="pt-4 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                {secondaryActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (index + 2) * 0.1 }}
                  >
                    <Button
                      variant="outline"
                      onClick={action.action}
                      disabled={!isReady}
                      className="w-full h-auto p-4 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <action.icon className="h-5 w-5 text-slate-600" />
                        <span className="text-sm font-medium text-slate-700">{action.title}</span>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ModernQuickActions;
