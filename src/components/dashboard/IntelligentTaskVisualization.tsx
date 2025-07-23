
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, AlertTriangle, User, Calendar, ArrowRight, TrendingUp, Target } from 'lucide-react';
import { Task } from '@/types';
import { isTaskOverdue } from '@/utils/taskUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface IntelligentTaskVisualizationProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const IntelligentTaskVisualization: React.FC<IntelligentTaskVisualizationProps> = ({ tasks, onTaskClick }) => {
  const { isReady } = useAuth();
  const navigate = useNavigate();
  const activeTasks = tasks.filter(task => task.status !== 'Completed').slice(0, 6);

  const handleViewAll = () => {
    if (!isReady) {
      toast.error('Please wait for your profile to load');
      return;
    }
    navigate('/dashboard/tasks');
  };

  const handleTaskClick = (task: Task) => {
    if (!isReady) {
      toast.error('Please wait for your profile to load');
      return;
    }
    onTaskClick(task);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'In Progress':
        return <Clock className="h-4 w-4 text-amber-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-slate-500" />;
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'High':
        return {
          dot: 'bg-red-500',
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-200'
        };
      case 'Medium':
        return {
          dot: 'bg-amber-500',
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200'
        };
      case 'Low':
        return {
          dot: 'bg-emerald-500',
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200'
        };
      default:
        return {
          dot: 'bg-slate-400',
          bg: 'bg-slate-50',
          text: 'text-slate-600',
          border: 'border-slate-200'
        };
    }
  };

  const getTaskUrgency = (task: Task) => {
    const isOverdue = isTaskOverdue(task);
    const dueToday = new Date(task.deadline).toDateString() === new Date().toDateString();
    
    if (isOverdue) return { 
      label: 'Overdue', 
      styles: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200'
      }
    };
    if (dueToday) return { 
      label: 'Due Today', 
      styles: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200'
      }
    };
    return { 
      label: 'Upcoming', 
      styles: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200'
      }
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="h-full"
    >
      <Card className="h-full border-0 bg-white shadow-sm ring-1 ring-slate-200/50">
        <CardHeader className="pb-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Task Intelligence
                </CardTitle>
                <p className="text-sm text-slate-600 mt-0.5">
                  Smart prioritization and insights
                </p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleViewAll}
              disabled={!isReady}
              className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 shadow-sm"
            >
              View All
              <ArrowRight className="h-3 w-3 ml-1.5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {activeTasks.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {activeTasks.map((task, index) => {
                const urgency = getTaskUrgency(task);
                const priorityStyles = getPriorityStyles(task.priority);
                
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    onClick={() => handleTaskClick(task)}
                    className={`group relative p-6 hover:bg-slate-50/50 transition-all duration-200 cursor-pointer ${
                      !isReady ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {/* Priority indicator line */}
                    <div className={`absolute left-0 top-0 w-0.5 h-full ${priorityStyles.dot}`} />
                    
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5 flex-shrink-0">
                        {getStatusIcon(task.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h4 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge 
                              variant="outline" 
                              className={`text-xs font-medium ${priorityStyles.bg} ${priorityStyles.text} ${priorityStyles.border} px-2 py-0.5`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${priorityStyles.dot} mr-1.5`} />
                              {task.priority}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs font-medium ${urgency.styles.bg} ${urgency.styles.text} ${urgency.styles.border} px-2 py-0.5`}
                            >
                              {urgency.label}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-medium">
                              {new Date(task.deadline).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                          
                          {task.assignedToName && (
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-slate-400" />
                              <span className="font-medium truncate max-w-32">
                                {task.assignedToName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 px-6"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">All caught up!</h3>
              <p className="text-slate-600 max-w-sm mx-auto">
                No pending tasks in your queue. Great work on staying organized!
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default IntelligentTaskVisualization;
