
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Brain, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  User, 
  Calendar, 
  ArrowRight,
  Filter,
  Sort,
  MoreHorizontal,
  Zap,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Task } from '@/types';
import { isTaskOverdue } from '@/utils/taskUtils';

interface TaskIntelligenceHubProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const TaskIntelligenceHub: React.FC<TaskIntelligenceHubProps> = ({ tasks, onTaskClick }) => {
  const [viewMode, setViewMode] = useState<'priority' | 'timeline' | 'smart'>('smart');
  
  const activeTasks = tasks.filter(task => task.status !== 'Completed');
  
  // AI-powered task prioritization
  const getTaskPriority = (task: Task) => {
    const isOverdue = isTaskOverdue(task);
    const dueToday = new Date(task.deadline).toDateString() === new Date().toDateString();
    const dueTomorrow = new Date(task.deadline).toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();
    
    let score = 0;
    
    // Base priority score
    if (task.priority === 'High') score += 40;
    else if (task.priority === 'Medium') score += 20;
    else score += 10;
    
    // Deadline urgency
    if (isOverdue) score += 50;
    else if (dueToday) score += 30;
    else if (dueTomorrow) score += 20;
    
    // Status consideration
    if (task.status === 'In Progress') score += 15;
    
    return score;
  };

  const smartSortedTasks = [...activeTasks]
    .sort((a, b) => getTaskPriority(b) - getTaskPriority(a))
    .slice(0, 8);

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
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-200',
          dot: 'bg-red-500'
        };
      case 'Medium':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          dot: 'bg-amber-500'
        };
      default:
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          dot: 'bg-emerald-500'
        };
    }
  };

  const getTaskUrgency = (task: Task) => {
    const isOverdue = isTaskOverdue(task);
    const dueToday = new Date(task.deadline).toDateString() === new Date().toDateString();
    const priorityScore = getTaskPriority(task);
    
    if (isOverdue) return { 
      label: 'Overdue', 
      color: 'bg-red-100 text-red-800 border-red-200',
      urgency: 'critical'
    };
    if (dueToday) return { 
      label: 'Due Today', 
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      urgency: 'high'
    };
    if (priorityScore > 40) return {
      label: 'High Priority',
      color: 'bg-violet-100 text-violet-800 border-violet-200',
      urgency: 'elevated'
    };
    
    return { 
      label: 'Normal', 
      color: 'bg-slate-100 text-slate-800 border-slate-200',
      urgency: 'normal'
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="col-span-2"
    >
      <Card className="h-full border-0 bg-white shadow-sm ring-1 ring-slate-200/50">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-sm">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Task Intelligence Hub
                </CardTitle>
                <p className="text-sm text-slate-600 mt-0.5">
                  AI-powered prioritization and insights
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'smart' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('smart')}
                  className="h-7 px-3 text-xs"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Smart
                </Button>
                <Button
                  variant={viewMode === 'priority' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('priority')}
                  className="h-7 px-3 text-xs"
                >
                  <Target className="h-3 w-3 mr-1" />
                  Priority
                </Button>
                <Button
                  variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('timeline')}
                  className="h-7 px-3 text-xs"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Timeline
                </Button>
              </div>
              
              <Button variant="outline" size="sm">
                <Filter className="h-3 w-3 mr-1" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {smartSortedTasks.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {smartSortedTasks.map((task, index) => {
                const urgency = getTaskUrgency(task);
                const priorityStyles = getPriorityStyles(task.priority);
                const priorityScore = getTaskPriority(task);
                
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    onClick={() => onTaskClick(task)}
                    className="group relative p-4 hover:bg-slate-50/50 transition-all duration-200 cursor-pointer"
                  >
                    {/* Priority Score Indicator */}
                    <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-slate-800 to-slate-600" 
                         style={{ opacity: Math.min(priorityScore / 100, 1) }} />
                    
                    <div className="flex items-start gap-4">
                      <div className="mt-1 flex-shrink-0">
                        {getStatusIcon(task.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900 group-hover:text-slate-700 transition-colors leading-snug mb-1">
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span className="font-medium">Priority Score: {priorityScore}</span>
                              <span>•</span>
                              <span>{urgency.urgency}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge 
                              variant="outline" 
                              className={`text-xs font-medium ${priorityStyles.bg} ${priorityStyles.text} ${priorityStyles.border} px-2 py-1`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${priorityStyles.dot} mr-1.5`} />
                              {task.priority}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs font-medium ${urgency.color} px-2 py-1`}
                            >
                              {urgency.label}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-slate-600">
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
                                <Avatar className="h-4 w-4">
                                  <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                                    {task.assignedToName.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium truncate max-w-24">
                                  {task.assignedToName}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 px-6"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">All systems optimal</h3>
              <p className="text-slate-600 max-w-sm mx-auto">
                Your task queue is clear. Great work on maintaining operational excellence!
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TaskIntelligenceHub;
