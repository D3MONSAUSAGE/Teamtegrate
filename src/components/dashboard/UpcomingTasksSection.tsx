import React, { useState } from 'react';
import { Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { format, isToday, isTomorrow } from 'date-fns';
import { cn } from "@/lib/utils";
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

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Upcoming Tasks
          </CardTitle>
          <Button variant="outline" size="icon" onClick={onCreateTask}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-4 h-32">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No upcoming tasks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const taskDate = new Date(task.deadline);
                const isTodayTask = isToday(taskDate);
                const isTomorrowTask = isTomorrow(taskDate);
                const formattedDate = isTodayTask
                  ? 'Today'
                  : isTomorrowTask
                    ? 'Tomorrow'
                    : format(taskDate, 'MMM dd');

                return (
                  <div key={task.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{task.title}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{formattedDate}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => onEditTask(task)}>
                        <Clock className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      <EnhancedCreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        onTaskComplete={() => setIsCreateTaskOpen(false)}
      />
    </>
  );
};

export default UpcomingTasksSection;
