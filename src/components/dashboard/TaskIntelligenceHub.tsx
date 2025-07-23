
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Brain, 
  ArrowUpDown, 
  Filter, 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  PlayCircle,
  User,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Task } from '@/types';

interface TaskIntelligenceHubProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const TaskIntelligenceHub: React.FC<TaskIntelligenceHubProps> = ({ tasks, onTaskClick }) => {
  const { prioritizedTasks, tasksByStatus, insights } = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    // Prioritize tasks based on deadline, priority, and status
    const prioritized = [...tasks]
      .filter(task => task.status !== 'Completed')
      .sort((a, b) => {
        const aDeadline = new Date(a.deadline);
        const bDeadline = new Date(b.deadline);
        
        // Overdue tasks first
        const aOverdue = aDeadline < today;
        const bOverdue = bDeadline < today;
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        
        // Then by priority
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by deadline
        return aDeadline.getTime() - bDeadline.getTime();
      })
      .slice(0, 8);

    // Group by status
    const byStatus = {
      'To Do': tasks.filter(t => t.status === 'To Do'),
      'In Progress': tasks.filter(t => t.status === 'In Progress'),
      'Completed': tasks.filter(t => t.status === 'Completed')
    };

    // Generate insights
    const overdueTasks = tasks.filter(task => {
      const taskDate = new Date(task.deadline);
      return taskDate < today && task.status !== 'Completed';
    });

    const dueTodayTasks = tasks.filter(task => {
      const taskDate = new Date(task.deadline);
      return taskDate.toDateString() === today.toDateString();
    });

    const taskInsights = [
      {
        title: 'Overdue Tasks',
        count: overdueTasks.length,
        type: 'warning' as const,
        description: 'Tasks that need immediate attention'
      },
      {
        title: 'Due Today',
        count: dueTodayTasks.length,
        type: 'info' as const,
        description: 'Tasks due by end of day'
      },
      {
        title: 'In Progress',
        count: byStatus['In Progress'].length,
        type: 'success' as const,
        description: 'Tasks currently being worked on'
      },
      {
        title: 'Completed',
        count: byStatus['Completed'].length,
        type: 'neutral' as const,
        description: 'Tasks finished this period'
      }
    ];

    return {
      prioritizedTasks: prioritized,
      tasksByStatus: byStatus,
      insights: taskInsights
    };
  }, [tasks]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'To Do':
        return <Circle className="h-4 w-4 text-slate-500" />;
      case 'In Progress':
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'Completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Circle className="h-4 w-4 text-slate-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const isOverdue = (deadline: Date) => {
    return new Date(deadline) < new Date() && new Date(deadline).toDateString() !== new Date().toDateString();
  };

  const formatDeadline = (deadline: Date) => {
    const today = new Date();
    const taskDate = new Date(deadline);
    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    return `${diffDays} days`;
  };

  // Loading state
  if (!tasks || tasks.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="w-48 h-6" />
              <Skeleton className="w-24 h-8" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                  <Skeleton className="w-4 h-4 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="w-3/4 h-4 mb-2" />
                    <Skeleton className="w-1/2 h-3" />
                  </div>
                  <Skeleton className="w-16 h-6 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="space-y-6"
    >
      {/* Task Intelligence Header */}
      <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200/50">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Task Intelligence Hub
                </CardTitle>
                <p className="text-xs text-slate-600 mt-0">
                  AI-powered task prioritization and insights
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-xs">
                <Filter className="h-3 w-3 mr-1" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                Sort
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {insights.map((insight, index) => (
              <motion.div
                key={insight.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`p-3 rounded-lg border ${getInsightColor(insight.type)}`}
              >
                <div className="text-2xl font-bold">{insight.count}</div>
                <div className="text-sm font-medium">{insight.title}</div>
                <div className="text-xs mt-1 opacity-75">{insight.description}</div>
              </motion.div>
            ))}
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-900">Priority Tasks</h4>
              <span className="text-xs text-slate-500">{prioritizedTasks.length} items</span>
            </div>
            
            <div className="space-y-2">
              {prioritizedTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-all duration-200"
                  onClick={() => onTaskClick(task)}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-slate-900 truncate">{task.title}</h5>
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className={isOverdue(task.deadline) ? 'text-red-600' : ''}>
                            {formatDeadline(task.deadline)}
                          </span>
                        </div>
                        {task.assignedToName && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{task.assignedToName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default React.memo(TaskIntelligenceHub);
