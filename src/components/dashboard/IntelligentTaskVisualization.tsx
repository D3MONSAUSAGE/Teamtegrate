
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, AlertTriangle, User, Calendar, ArrowRight, Filter } from 'lucide-react';
import { Task } from '@/types';
import { isTaskOverdue } from '@/utils/taskUtils';

interface IntelligentTaskVisualizationProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const IntelligentTaskVisualization: React.FC<IntelligentTaskVisualizationProps> = ({ tasks, onTaskClick }) => {
  const activeTasks = tasks.filter(task => task.status !== 'Completed').slice(0, 6);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="h-5 w-5 text-dashboard-success" />;
      case 'In Progress':
        return <Clock className="h-5 w-5 text-dashboard-warning" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-dashboard-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-dashboard-error/10 text-dashboard-error border-dashboard-error/20';
      case 'Medium':
        return 'bg-dashboard-warning/10 text-dashboard-warning border-dashboard-warning/20';
      case 'Low':
        return 'bg-dashboard-success/10 text-dashboard-success border-dashboard-success/20';
      default:
        return 'bg-dashboard-gray-100 text-dashboard-gray-600 border-dashboard-gray-200';
    }
  };

  const getTaskUrgency = (task: Task) => {
    const isOverdue = isTaskOverdue(task);
    const dueToday = new Date(task.deadline).toDateString() === new Date().toDateString();
    
    if (isOverdue) return { label: 'Overdue', color: 'text-dashboard-error', bgColor: 'bg-dashboard-error/10' };
    if (dueToday) return { label: 'Due Today', color: 'text-dashboard-warning', bgColor: 'bg-dashboard-warning/10' };
    return { label: 'Upcoming', color: 'text-dashboard-success', bgColor: 'bg-dashboard-success/10' };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card className="border-0 bg-white/60 backdrop-blur-xl shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-dashboard-primary/5 via-transparent to-dashboard-teal/5" />
        
        <CardHeader className="relative pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-dashboard-primary/10 flex items-center justify-center">
                <Filter className="h-6 w-6 text-dashboard-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-dashboard-gray-900">
                  Task Intelligence
                </CardTitle>
                <p className="text-dashboard-gray-600 mt-1">
                  Smart prioritization and insights
                </p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="border-dashboard-border bg-white/50 hover:bg-white/70 backdrop-blur-sm"
            >
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="relative space-y-4">
          {activeTasks.map((task, index) => {
            const urgency = getTaskUrgency(task);
            
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                onClick={() => onTaskClick(task)}
                className="group relative p-6 rounded-2xl border border-dashboard-border/50 bg-white/40 hover:bg-white/60 backdrop-blur-sm transition-all duration-300 cursor-pointer"
              >
                {/* Priority indicator */}
                <div className={`absolute left-0 top-0 w-1 h-full rounded-l-2xl ${
                  task.priority === 'High' ? 'bg-dashboard-error' :
                  task.priority === 'Medium' ? 'bg-dashboard-warning' :
                  'bg-dashboard-success'
                }`} />
                
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      {getStatusIcon(task.status)}
                    </div>
                    
                    <div className="space-y-3 flex-1">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-dashboard-gray-900 group-hover:text-dashboard-primary transition-colors text-lg">
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${urgency.color} ${urgency.bgColor} border-current/20`}
                          >
                            {urgency.label}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-dashboard-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(task.deadline).toLocaleDateString()}</span>
                        </div>
                        
                        {task.assignedToName && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{task.assignedToName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <ArrowRight className="h-5 w-5 text-dashboard-gray-400 group-hover:text-dashboard-primary transition-colors opacity-0 group-hover:opacity-100 ml-4" />
                </div>
              </motion.div>
            );
          })}
          
          {activeTasks.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-dashboard-success opacity-50" />
              <p className="text-xl font-semibold text-dashboard-gray-900 mb-2">All caught up!</p>
              <p className="text-dashboard-gray-600">No pending tasks in your queue</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default IntelligentTaskVisualization;
