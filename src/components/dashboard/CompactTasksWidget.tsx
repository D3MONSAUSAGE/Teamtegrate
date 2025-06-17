
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, Clock, CheckCircle } from 'lucide-react';
import { Task } from '@/types';
import TaskCard from '@/components/task-card/TaskCard';

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
  return (
    <Card className="bg-card/70 backdrop-blur-sm border shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">My Tasks</h3>
          <Button size="default" onClick={onCreateTask} className="h-10 px-4">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
            <TabsTrigger value="today" className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Today ({todaysTasks.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Upcoming ({upcomingTasks.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="today" className="space-y-3 max-h-80 overflow-y-auto">
            {todaysTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-base">No tasks for today</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              todaysTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="transform hover:scale-[1.02] transition-transform">
                  <TaskCard task={task} onEdit={onEditTask} />
                </div>
              ))
            )}
            {todaysTasks.length > 4 && (
              <div className="text-center py-3">
                <Button variant="outline" size="sm" className="text-sm">
                  View {todaysTasks.length - 4} more tasks
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="upcoming" className="space-y-3 max-h-80 overflow-y-auto">
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-base">No upcoming tasks</p>
                <p className="text-sm">Your schedule is clear</p>
              </div>
            ) : (
              upcomingTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="transform hover:scale-[1.02] transition-transform">
                  <TaskCard task={task} onEdit={onEditTask} />
                </div>
              ))
            )}
            {upcomingTasks.length > 4 && (
              <div className="text-center py-3">
                <Button variant="outline" size="sm" className="text-sm">
                  View {upcomingTasks.length - 4} more tasks
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CompactTasksWidget;
