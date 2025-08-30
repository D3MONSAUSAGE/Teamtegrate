import React, { useState, useMemo } from 'react';
import { Task, TaskStatus } from '@/types';
import TaskCard from '@/components/task-card';
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Calendar, TrendingUp } from 'lucide-react';
import { format, isToday, isYesterday, startOfDay, endOfDay } from 'date-fns';
import TaskDetailDialog from '@/components/calendar/TaskDetailDialog';
import CompletedTasksDateFilter from './CompletedTasksDateFilter';

interface GroupedCompletedTasksListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onNewTask: () => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => Promise<void>;
}

interface TaskGroup {
  date: string;
  label: string;
  tasks: Task[];
}

const GroupedCompletedTasksList: React.FC<GroupedCompletedTasksListProps> = ({
  tasks,
  onEdit,
  onNewTask,
  onStatusChange
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [dateFilter, setDateFilter] = useState('last30days');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['today', 'yesterday']));

  const handleOpenDetails = (task: Task) => {
    setSelectedTask(task);
    setShowDetails(true);
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus): Promise<void> => {
    if (onStatusChange) {
      await onStatusChange(taskId, status);
    }
  };

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const filteredTasks = useMemo(() => {
    const now = new Date();
    
    return tasks.filter(task => {
      if (!task.completedAt) return false;
      
      const completedDate = task.completedAt;
      
      switch (dateFilter) {
        case 'today':
          return isToday(completedDate);
        case 'yesterday':
          return isYesterday(completedDate);
        case 'last7days':
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return completedDate >= sevenDaysAgo;
        case 'last30days':
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return completedDate >= thirtyDaysAgo;
        case 'thisMonth':
          return completedDate.getMonth() === now.getMonth() && 
                 completedDate.getFullYear() === now.getFullYear();
        case 'lastMonth':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
          return completedDate.getMonth() === lastMonth.getMonth() && 
                 completedDate.getFullYear() === lastMonth.getFullYear();
        case 'all':
        default:
          return true;
      }
    });
  }, [tasks, dateFilter]);

  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: TaskGroup } = {};
    
    filteredTasks.forEach(task => {
      if (!task.completedAt) return;
      
      const completedDate = task.completedAt;
      let groupKey: string;
      let label: string;
      
      if (isToday(completedDate)) {
        groupKey = 'today';
        label = 'Today';
      } else if (isYesterday(completedDate)) {
        groupKey = 'yesterday';
        label = 'Yesterday';
      } else {
        groupKey = format(completedDate, 'yyyy-MM-dd');
        label = format(completedDate, 'EEEE, MMMM do, yyyy');
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          date: groupKey,
          label,
          tasks: []
        };
      }
      
      groups[groupKey].tasks.push(task);
    });
    
    // Sort groups by date (most recent first)
    return Object.values(groups).sort((a, b) => {
      if (a.date === 'today') return -1;
      if (b.date === 'today') return 1;
      if (a.date === 'yesterday') return -1;
      if (b.date === 'yesterday') return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [filteredTasks]);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-border/30 shadow-xl mb-8">
            <TrendingUp className="h-12 w-12 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">No completed tasks</h3>
          <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
            Complete some tasks to see them organized by completion date here.
          </p>
          <Button 
            variant="outline" 
            onClick={onNewTask}
            className="gap-3 h-12 px-6 rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 hover:border-primary/50 hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            <Calendar className="h-5 w-5" /> 
            <span className="font-semibold">Create First Task</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CompletedTasksDateFilter
        selectedFilter={dateFilter}
        onFilterChange={setDateFilter}
        taskCount={filteredTasks.length}
      />
      
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No tasks found</h3>
          <p className="text-muted-foreground">No completed tasks in the selected time period.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedTasks.map((group) => {
            const isExpanded = expandedGroups.has(group.date);
            
            return (
              <Collapsible
                key={group.date}
                open={isExpanded}
                onOpenChange={() => toggleGroup(group.date)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto bg-card/40 border border-border/30 rounded-xl hover:bg-card/60 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Calendar className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="font-medium text-foreground">{group.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-green-500/10 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                        {group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-3 lg:gap-4 p-4">
                    {group.tasks.map((task, index) => (
                      <div 
                        key={task.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <TaskCard 
                          task={task} 
                          onEdit={onEdit} 
                          onClick={() => handleOpenDetails(task)}
                          onStatusChange={handleStatusChange}
                        />
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}
      
      <TaskDetailDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        task={selectedTask}
      />
    </div>
  );
};

export default GroupedCompletedTasksList;