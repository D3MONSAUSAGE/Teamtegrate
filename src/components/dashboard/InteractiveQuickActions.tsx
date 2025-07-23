
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Calendar, BarChart3, Settings, Zap } from 'lucide-react';

interface InteractiveQuickActionsProps {
  onCreateTask: () => void;
}

const InteractiveQuickActions: React.FC<InteractiveQuickActionsProps> = ({ onCreateTask }) => {
  const actions = [
    {
      title: 'Create Task',
      description: 'Add a new task to your workflow',
      icon: Plus,
      color: 'from-dashboard-primary to-dashboard-primary-light',
      bgColor: 'bg-dashboard-primary/10',
      action: onCreateTask
    },
    {
      title: 'Team Overview',
      description: 'Check team performance and progress',
      icon: Users,
      color: 'from-dashboard-teal to-dashboard-teal-light',
      bgColor: 'bg-dashboard-teal/10',
      action: () => console.log('Team overview')
    },
    {
      title: 'Schedule Meeting',
      description: 'Plan your next team collaboration',
      icon: Calendar,
      color: 'from-dashboard-purple to-dashboard-purple-light',
      bgColor: 'bg-dashboard-purple/10',
      action: () => console.log('Schedule meeting')
    },
    {
      title: 'Analytics',
      description: 'View detailed productivity insights',
      icon: BarChart3,
      color: 'from-dashboard-success to-dashboard-success-light',
      bgColor: 'bg-dashboard-success/10',
      action: () => console.log('Analytics')
    },
    {
      title: 'Quick Setup',
      description: 'Configure your workspace settings',
      icon: Settings,
      color: 'from-dashboard-warning to-dashboard-warning-light',
      bgColor: 'bg-dashboard-warning/10',
      action: () => console.log('Settings')
    },
    {
      title: 'Productivity Boost',
      description: 'Get personalized recommendations',
      icon: Zap,
      color: 'from-dashboard-error to-dashboard-error-light',
      bgColor: 'bg-dashboard-error/10',
      action: () => console.log('Productivity boost')
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <Card className="border-0 bg-white/60 backdrop-blur-xl shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-dashboard-teal/5 via-transparent to-dashboard-purple/5" />
        
        <CardHeader className="relative pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-dashboard-teal/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-dashboard-teal" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-dashboard-gray-900">
                Quick Actions
              </CardTitle>
              <p className="text-dashboard-gray-600 mt-1">
                Boost your productivity with one click
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={action.action}
                  variant="outline"
                  className="group relative w-full h-auto p-6 border-dashboard-border/50 bg-white/40 hover:bg-white/60 backdrop-blur-sm transition-all duration-300 rounded-2xl"
                >
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`} />
                  
                  <div className="relative flex items-start gap-4 text-left">
                    <div className={`w-12 h-12 rounded-xl ${action.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className="h-6 w-6 text-current" />
                    </div>
                    
                    <div className="space-y-1 flex-1">
                      <h4 className="font-semibold text-dashboard-gray-900 group-hover:text-dashboard-primary transition-colors">
                        {action.title}
                      </h4>
                      <p className="text-sm text-dashboard-gray-600 group-hover:text-dashboard-gray-700 transition-colors">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default InteractiveQuickActions;
