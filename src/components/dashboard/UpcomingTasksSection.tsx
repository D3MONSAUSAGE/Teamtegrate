import React, { useState, useMemo } from 'react';
import { Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, ChevronDown, ChevronRight, AlertTriangle, Sparkles } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { format, isToday, isTomorrow, isThisWeek, addDays, startOfDay, endOfWeek } from 'date-fns';
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import TaskCard from '@/components/task/TaskCard';
import EnhancedCreateTaskDialog from '@/components/task/EnhancedCreateTaskDialog';

interface UpcomingTasksSectionProps {
  tasks: Task[];
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
}

const UpcomingTasksSection: React.FC<UpcomingTasksSectionProps> = ({
  tasks,
  onCreateTask,
  onEditTask
}) => {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({
    tomorrow: true,
    thisWeek: true,
    nextWeek: true
  });

  // Group tasks by time periods
  const groupedTasks = useMemo(() => {
    const now = new Date();
    const tomorrow = addDays(startOfDay(now), 1);
    const dayAfterTomorrow = addDays(tomorrow, 1);
    const endOfThisWeek = endOfWeek(now);
    const nextWeekEnd = addDays(endOfThisWeek, 7);

    const groups = {
      tomorrow: [] as Task[],
      thisWeek: [] as Task[],
      nextWeek: [] as Task[]
    };

    tasks.forEach(task => {
      const taskDate = startOfDay(new Date(task.deadline));
      
      if (taskDate.getTime() === tomorrow.getTime()) {
        groups.tomorrow.push(task);
      } else if (taskDate > tomorrow && taskDate <= endOfThisWeek) {
        groups.thisWeek.push(task);
      } else if (taskDate > endOfThisWeek && taskDate <= nextWeekEnd) {
        groups.nextWeek.push(task);
      }
    });

    // Sort tasks within each group by deadline
    Object.values(groups).forEach(group => 
      group.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    );

    return groups;
  }, [tasks]);

  const toggleGroup = (group: keyof typeof openGroups) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const totalTasks = tasks.length;

  const TaskGroup = ({ 
    title, 
    tasks, 
    isOpen, 
    onToggle, 
    icon: Icon,
    gradient 
  }: {
    title: string;
    tasks: Task[];
    isOpen: boolean;
    onToggle: () => void;
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
  }) => (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div className={cn(
          "flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all duration-300",
          "hover:shadow-lg hover:scale-[1.02] group",
          gradient
        )}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="text-xs text-white/80">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {tasks.length}
            </Badge>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-white transition-transform group-hover:scale-110" />
            ) : (
              <ChevronRight className="h-4 w-4 text-white transition-transform group-hover:scale-110" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-3 animate-fade-in">
        {tasks.map((task, index) => (
          <div 
            key={task.id} 
            className="animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <TaskCard
              task={task}
              onClick={() => onEditTask(task)}
              className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            />
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center space-y-6 py-12">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <Calendar className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Sparkles className="h-3 w-3 text-white" />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-foreground">Your schedule is clear!</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          No upcoming tasks in the next two weeks. Perfect time to plan ahead or take a well-deserved break.
        </p>
      </div>
      
      <Button 
        onClick={onCreateTask}
        className="bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all duration-300 hover:scale-105"
      >
        <Plus className="h-4 w-4 mr-2" />
        Plan Your Next Task
      </Button>
    </div>
  );

  return (
    <>
      <div className="w-full space-y-4">
        {totalTasks === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {groupedTasks.tomorrow.length > 0 && (
              <TaskGroup
                title="Tomorrow"
                tasks={groupedTasks.tomorrow}
                isOpen={openGroups.tomorrow}
                onToggle={() => toggleGroup('tomorrow')}
                icon={AlertTriangle}
                gradient="bg-gradient-to-r from-amber-500 to-orange-500"
              />
            )}
            
            {groupedTasks.thisWeek.length > 0 && (
              <TaskGroup
                title="This Week"
                tasks={groupedTasks.thisWeek}
                isOpen={openGroups.thisWeek}
                onToggle={() => toggleGroup('thisWeek')}
                icon={Calendar}
                gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
              />
            )}
            
            {groupedTasks.nextWeek.length > 0 && (
              <TaskGroup
                title="Next Week"
                tasks={groupedTasks.nextWeek}
                isOpen={openGroups.nextWeek}
                onToggle={() => toggleGroup('nextWeek')}
                icon={Clock}
                gradient="bg-gradient-to-r from-purple-500 to-pink-500"
              />
            )}
          </div>
        )}
      </div>
      
      <EnhancedCreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        onTaskComplete={() => setIsCreateTaskOpen(false)}
      />
    </>
  );
};

export default UpcomingTasksSection;
