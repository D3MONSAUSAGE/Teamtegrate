
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Users, BarChart3, Zap, Clock, Target } from 'lucide-react';

interface QuickActionsPanelProps {
  onCreateTask: () => void;
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ onCreateTask }) => {
  const quickActions = [
    {
      icon: Plus,
      title: 'New Task',
      description: 'Create a new task',
      action: onCreateTask,
      gradient: 'from-blue-500 to-indigo-600',
      hoverGradient: 'hover:from-blue-600 hover:to-indigo-700'
    },
    {
      icon: Calendar,
      title: 'Schedule Meeting',
      description: 'Plan team sync',
      action: () => console.log('Schedule meeting'),
      gradient: 'from-purple-500 to-pink-600',
      hoverGradient: 'hover:from-purple-600 hover:to-pink-700'
    },
    {
      icon: Users,
      title: 'Invite Member',
      description: 'Add team member',
      action: () => console.log('Invite member'),
      gradient: 'from-emerald-500 to-teal-600',
      hoverGradient: 'hover:from-emerald-600 hover:to-teal-700'
    },
    {
      icon: BarChart3,
      title: 'View Reports',
      description: 'Check analytics',
      action: () => console.log('View reports'),
      gradient: 'from-amber-500 to-orange-600',
      hoverGradient: 'hover:from-amber-600 hover:to-orange-700'
    }
  ];

  const productivityTips = [
    {
      icon: Zap,
      tip: "Focus on 3 key tasks today",
      color: "text-yellow-500"
    },
    {
      icon: Clock,
      tip: "Take breaks every 90 minutes",
      color: "text-blue-500"
    },
    {
      icon: Target,
      tip: "Set clear daily goals",
      color: "text-emerald-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="overflow-hidden bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border-slate-200/50 dark:border-slate-700/30">
        <CardHeader className="bg-gradient-to-r from-slate-600 to-gray-700 text-white">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5" />
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-4">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  onClick={action.action}
                  className={`h-auto p-4 justify-start bg-gradient-to-r ${action.gradient} ${action.hoverGradient} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{action.title}</div>
                      <div className="text-sm text-white/80">{action.description}</div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Productivity Tips */}
      <Card className="overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200/50 dark:border-indigo-800/30">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5" />
            <CardTitle className="text-lg">Productivity Tips</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {productivityTips.map((tip, index) => {
              const IconComponent = tip.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20"
                >
                  <IconComponent className={`h-5 w-5 ${tip.color}`} />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {tip.tip}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Today's Focus */}
      <Card className="overflow-hidden bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-rose-200/50 dark:border-rose-800/30">
        <CardHeader className="bg-gradient-to-r from-rose-500 to-pink-600 text-white">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5" />
            <CardTitle className="text-lg">Today's Focus</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
              What's your main goal today?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Focus on what matters most
            </p>
            <Button 
              onClick={onCreateTask}
              className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Set Today's Goal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickActionsPanel;
