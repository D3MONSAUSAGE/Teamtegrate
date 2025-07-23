
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Award, BarChart3 } from 'lucide-react';

const ProgressInsights: React.FC = () => {
  const insights = [
    {
      title: 'Weekly Progress',
      value: '78%',
      change: '+12%',
      trend: 'up',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      progress: 78
    },
    {
      title: 'Task Completion',
      value: '24/30',
      change: '+3',
      trend: 'up',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      progress: 80
    },
    {
      title: 'Time Efficiency',
      value: '92%',
      change: '+5%',
      trend: 'up',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      progress: 92
    }
  ];

  const achievements = [
    {
      title: 'Task Master',
      description: 'Completed 50+ tasks this month',
      icon: Target,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'Team Player',
      description: 'Helped 5 colleagues with their tasks',
      icon: Award,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="h-full"
    >
      <Card className="h-full border-0 bg-white shadow-sm ring-1 ring-slate-200/50">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Progress Insights
              </CardTitle>
              <p className="text-sm text-slate-600 mt-0.5">
                Your productivity metrics
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Progress Metrics */}
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <motion.div
                  key={insight.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`p-4 rounded-lg ${insight.bgColor} border border-slate-200/50`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-slate-900">{insight.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${insight.color}`}>
                        {insight.value}
                      </span>
                      <Badge variant="secondary" className="text-xs bg-white/60 text-emerald-700">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {insight.change}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={insight.progress} className="h-2" />
                </motion.div>
              ))}
            </div>

            {/* Achievements */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-medium text-slate-900 mb-3">Recent Achievements</h4>
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.title}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-lg ${achievement.bgColor} border border-slate-200/50`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center flex-shrink-0">
                        <achievement.icon className={`h-4 w-4 ${achievement.color}`} />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-slate-900 text-sm">{achievement.title}</h5>
                        <p className="text-xs text-slate-600 mt-0.5">{achievement.description}</p>
                      </div>
                    </div>
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

export default ProgressInsights;
