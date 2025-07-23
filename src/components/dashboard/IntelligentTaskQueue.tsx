
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  User,
  Calendar,
  Filter,
  ArrowRight,
  Zap,
  Target
} from 'lucide-react';
import { Task } from '@/types';
import { isTaskOverdue } from '@/utils/taskUtils';

interface IntelligentTaskQueueProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const IntelligentTaskQueue: React.FC<IntelligentTaskQueueProps> = ({ tasks, onTaskClick }) => {
  const [activeFilter, setActiveFilter] = useState('priority');

  const getTaskPriority = (task: Task) => {
    const isOverdue = isTaskOverdue(task);
    const dueToday = new Date(task.deadline).toDateString() === new Date().toDateString();
    const dueTomorrow = new Date(task.deadline).toDateString() === new Date(Date.now() + 86400000).toDateString();
    
    let score = 0;
    
    // Priority scoring
    if (task.priority === 'High') score += 30;
    else if (task.priority === 'Medium') score += 20;
    else score += 10;
    
    // Deadline scoring
    if (isOverdue) score += 50;
    else if (dueToday) score += 40;
    else if (dueTomorrow) score += 30;
    
    // Status scoring
    if (task.status === 'In Progress') score += 25;
    else if (task.status === 'To Do') score += 20;
    
    return score;
  };

  const sortedTasks = [...tasks]
    .filter(task => task.status !== 'Completed')
    .sort((a, b) => {
      if (activeFilter === 'priority') {
        return getTaskPriority(b) - getTaskPriority(a);
      }
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    })
    .slice(0, 8);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="h-4 w-4 text-dashboard-success" />;
      case 'In Progress':
        return <Clock className="h-4 w-4 text-dashboard-warning" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-dashboard-gray-500" />;
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
    const score = getTaskPriority(task);
    if (score >= 60) return { label: 'Critical', color: 'text-dashboard-error' };
    if (score >= 40) return { label: 'High', color: 'text-dashboard-warning' };
    if (score >= 25) return { label: 'Medium', color: 'text-dashboard-primary' };
    return { label: 'Low', color: 'text-dashboard-success' };
  };

  const filters = [
    { id: 'priority', label: 'Smart Priority', icon: Zap },
    { id: 'deadline', label: 'Due Date', icon: Calendar }
  ];

  return (
    <Card className="border-0 shadow-base bg-dashboard-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-dashboard-primary/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-dashboard-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-dashboard-gray-900">
                Task Queue
              </CardTitle>
              <p className="text-sm text-dashboard-gray-600">
                Intelligently prioritized tasks
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                variant={activeFilter === filter.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-2 ${
                  activeFilter === filter.id 
                    ? 'bg-dashboard-primary text-dashboard-primary-foreground' 
                    : 'border-dashboard-border hover:bg-dashboard-card-hover'
                }`}
              >
                <filter.icon className="h-3 w-3" />
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {sortedTasks.map((task) => {
          const urgency = getTaskUrgency(task);
          
          return (
            <div 
              key={task.id}
              onClick={() => onTaskClick(task)}
              className="group p-4 rounded-lg border border-dashboard-border hover:border-dashboard-primary/20 hover:bg-dashboard-card-hover transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(task.status)}
                  
                  <div className="space-y-2 flex-1">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-dashboard-gray-900 group-hover:text-dashboard-primary transition-colors">
                        {task.title}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(task.priority)} ml-2`}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-dashboard-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(task.deadline).toLocaleDateString()}</span>
                      </div>
                      
                      {task.assignedToName && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{task.assignedToName}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <span className={`font-medium ${urgency.color}`}>
                          {urgency.label} Priority
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <ArrowRight className="h-4 w-4 text-dashboard-gray-400 group-hover:text-dashboard-primary transition-colors opacity-0 group-hover:opacity-100" />
              </div>
            </div>
          );
        })}
        
        {sortedTasks.length === 0 && (
          <div className="text-center py-8 text-dashboard-gray-500">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm">No pending tasks in your queue</p>
          </div>
        )}
        
        <div className="pt-4 border-t border-dashboard-border">
          <Button 
            variant="outline" 
            className="w-full border-dashboard-border hover:bg-dashboard-card-hover"
          >
            View All Tasks
            <Filter className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default IntelligentTaskQueue;
