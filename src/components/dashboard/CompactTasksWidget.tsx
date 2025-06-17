
import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import { Task } from '@/types';
import TaskCard from '@/components/task-card/TaskCard';
import { Link } from 'react-router-dom';

interface CompactTasksWidgetProps {
  todaysTasks: Task[];
  upcomingTasks: Task[];
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
}

const CompactTasksWidget: React.FC<CompactTasksWidgetProps> = ({
  todaysTasks,
  upcomingTasks,
  onCreateTask,
  onEditTask
}) => {
  const displayTasks = todaysTasks.slice(0, 3);

  return (
    <Card className="bg-card/70 backdrop-blur-sm border shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-600/20">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Today's Tasks</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={onCreateTask} className="h-9 px-3">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
            <Link to="/dashboard/tasks">
              <Button variant="ghost" size="sm" className="h-9 px-3 text-blue-600 hover:bg-blue-500/10">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 pt-0">
        {displayTasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium mb-2">No tasks for today</p>
            <p className="text-sm mb-4">You're all caught up! Create a new task to get started.</p>
            <Button onClick={onCreateTask} className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Task
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {displayTasks.map((task) => (
              <div key={task.id} className="transform hover:scale-[1.02] transition-transform">
                <TaskCard task={task} onEdit={onEditTask} />
              </div>
            ))}
          </div>
        )}

        {todaysTasks.length > 3 && (
          <div className="text-center mt-6 pt-4 border-t border-border/50">
            <Link to="/dashboard/tasks">
              <Button variant="outline" size="sm" className="text-sm">
                View {todaysTasks.length - 3} more tasks
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border/50">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{todaysTasks.length}</div>
            <div className="text-sm text-muted-foreground">Today</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {todaysTasks.filter(t => t.status === 'Completed').length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-600">{upcomingTasks.length}</div>
            <div className="text-sm text-muted-foreground">Upcoming</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactTasksWidget;
