
import React, { useState } from 'react';
import { Task } from '@/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface FocusTaskSelectorProps {
  tasks: Task[];
  selectedTask: Task | null;
  onTaskSelect: (task: Task) => void;
}

const FocusTaskSelector: React.FC<FocusTaskSelectorProps> = ({
  tasks,
  selectedTask,
  onTaskSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'high-priority' | 'overdue'>('all');

  const isTaskOverdue = (deadline: Date) => {
    const taskDeadline = startOfDay(deadline);
    const today = startOfDay(new Date());
    return isBefore(taskDeadline, today);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (filter) {
      case 'today':
        return isToday(task.deadline);
      case 'high-priority':
        return task.priority === 'High';
      case 'overdue':
        return isTaskOverdue(task.deadline);
      default:
        return true;
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-500/20 text-red-700 dark:text-red-300';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
      case 'Low': return 'bg-green-500/20 text-green-700 dark:text-green-300';
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
    }
  };

  const getTaskStatus = (task: Task) => {
    if (isTaskOverdue(task.deadline)) return 'overdue';
    if (isToday(task.deadline)) return 'today';
    return 'upcoming';
  };

  return (
    <Card className="p-4 md:p-6 glass-card">
      <div className="mb-4 md:mb-6">
        <h3 className="text-lg font-semibold mb-3 md:mb-4">Select a Task to Focus On</h3>
        
        {/* Search */}
        <div className="relative mb-3 md:mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'all', label: 'All Tasks' },
            { key: 'today', label: 'Due Today' },
            { key: 'high-priority', label: 'High Priority' },
            { key: 'overdue', label: 'Overdue' }
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(key as any)}
              className="text-xs h-8"
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2 md:space-y-3 max-h-80 md:max-h-96 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-6 md:py-8 text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm md:text-base">No tasks found</p>
            <p className="text-xs md:text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const taskStatus = getTaskStatus(task);
            const isSelected = selectedTask?.id === task.id;

            return (
              <div
                key={task.id}
                onClick={() => onTaskSelect(task)}
                className={cn(
                  "p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md",
                  isSelected 
                    ? "border-primary bg-primary/5 shadow-lg" 
                    : "border-border/50 bg-background/50 hover:border-primary/50"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm line-clamp-2 pr-2">{task.title}</h4>
                  {taskStatus === 'overdue' && (
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  )}
                </div>

                {task.description && (
                  <p className="text-xs text-muted-foreground mb-2 md:mb-3 line-clamp-2">
                    {task.description}
                  </p>
                )}

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs", getPriorityColor(task.priority))}
                    >
                      {task.priority}
                    </Badge>
                    
                    {taskStatus === 'today' && (
                      <Badge variant="outline" className="text-xs">
                        Due Today
                      </Badge>
                    )}
                    
                    {taskStatus === 'overdue' && (
                      <Badge variant="destructive" className="text-xs">
                        Overdue
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                    <Calendar className="h-3 w-3" />
                    {format(task.deadline, 'MMM d')}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default FocusTaskSelector;
