
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';

const AnalyticsInsightsPanel: React.FC = () => {
  const insights = [
    {
      title: 'Productivity Trend',
      metric: '↗ 23%',
      description: 'Performance increased this week',
      trend: 'positive',
      icon: TrendingUp,
      color: 'emerald'
    },
    {
      title: 'Focus Time',
      metric: '4.2h',
      description: 'Average deep work sessions',
      trend: 'positive',
      icon: Clock,
      color: 'blue'
    },
    {
      title: 'Task Velocity',
      metric: '18/day',
      description: 'Tasks completed on average',
      trend: 'stable',
      icon: Activity,
      color: 'violet'
    },
    {
      title: 'Goal Progress',
      metric: '78%',
      description: 'Quarterly objectives on track',
      trend: 'positive',
      icon: Target,
      color: 'amber'
    }
  ];

  const weeklyData = [
    { day: 'Mon', tasks: 12, focus: 5.2 },
    { day: 'Tue', tasks: 15, focus: 4.8 },
    { day: 'Wed', tasks: 18, focus: 6.1 },
    { day: 'Thu', tasks: 22, focus: 5.5 },
    { day: 'Fri', tasks: 19, focus: 4.9 },
    { day: 'Sat', tasks: 8, focus: 2.3 },
    { day: 'Sun', tasks: 5, focus: 1.8 }
  ];

  const maxTasks = Math.max(...weeklyData.map(d => d.tasks));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="space-y-6"
    >
      {/* Performance Insights */}
      <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200/50">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-sm">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Performance Insights
                </CardTitle>
                <p className="text-xs text-slate-600 mt-0">
                  Real-time analytics and trends
                </p>
              </div>
            </div>
            
            <Button variant="outline" size="sm" className="text-xs">
              View Details
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <motion.div
                key={insight.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200/50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <insight.icon className={`h-4 w-4 text-${insight.color}-600`} />
                  <h4 className="font-medium text-slate-900 text-sm">{insight.title}</h4>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900">{insight.metric}</span>
                    {insight.trend === 'positive' && (
                      <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600">{insight.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Performance Chart */}
      <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200/50">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-sm">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Weekly Performance
                </CardTitle>
                <p className="text-xs text-slate-600 mt-0">
                  Tasks completed by day
                </p>
              </div>
            </div>
            
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <TrendingUp className="h-3 w-3 mr-1" />
              +15% vs last week
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="space-y-3">
            {weeklyData.map((day, index) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 text-xs font-medium text-slate-600">{day.day}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(day.tasks / maxTasks) * 100}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className="h-2 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full"
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-900 w-8">{day.tasks}</span>
                  </div>
                  <div className="text-xs text-slate-500">{day.focus}h focus time</div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200/50">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-sm">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Quick Actions
              </CardTitle>
              <p className="text-xs text-slate-600 mt-0">
                Streamlined workflow tools
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start text-sm h-8">
              <PieChart className="h-3 w-3 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm h-8">
              <Calendar className="h-3 w-3 mr-2" />
              Schedule Review
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm h-8">
              <Target className="h-3 w-3 mr-2" />
              Set Goals
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AnalyticsInsightsPanel;
