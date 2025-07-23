
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const UpcomingDeadlines: React.FC = () => {
  const { isReady } = useAuth();

  const deadlines = [
    {
      id: 1,
      title: 'Website Redesign Prototype',
      dueDate: '2024-01-15',
      priority: 'High',
      project: 'Marketing Hub',
      urgency: 'today',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      id: 2,
      title: 'User Research Analysis',
      dueDate: '2024-01-16',
      priority: 'Medium',
      project: 'Product Development',
      urgency: 'tomorrow',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    {
      id: 3,
      title: 'Database Migration Script',
      dueDate: '2024-01-18',
      priority: 'High',
      project: 'Backend Systems',
      urgency: 'upcoming',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 4,
      title: 'Monthly Performance Report',
      dueDate: '2024-01-20',
      priority: 'Medium',
      project: 'Analytics',
      urgency: 'upcoming',
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200'
    }
  ];

  const handleViewTask = (taskId: number) => {
    if (!isReady) {
      toast.error('Please wait for your profile to load');
      return;
    }
    console.log('View task:', taskId);
    toast.info('Task details would open here');
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'today':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'tomorrow':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <Calendar className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="h-full"
    >
      <Card className="h-full border-0 bg-white shadow-sm ring-1 ring-slate-200/50">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-sm">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Upcoming Deadlines
              </CardTitle>
              <p className="text-sm text-slate-600 mt-0.5">
                Tasks requiring attention soon
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {deadlines.map((deadline, index) => (
              <motion.div
                key={deadline.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-4 hover:bg-slate-50/50 transition-colors duration-200 group cursor-pointer"
                onClick={() => handleViewTask(deadline.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    {getUrgencyIcon(deadline.urgency)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                        {deadline.title}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs font-medium ${deadline.bgColor} ${deadline.color} ${deadline.borderColor} px-2 py-0.5 flex-shrink-0`}
                      >
                        {deadline.priority}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="font-medium">
                          {new Date(deadline.dueDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        <span>•</span>
                        <span className="truncate">{deadline.project}</span>
                      </div>
                      
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UpcomingDeadlines;
