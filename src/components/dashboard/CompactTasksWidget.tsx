
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, Clock } from 'lucide-react';
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
    <Card className="bg-card/70 backdrop-blur-sm border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Tasks</h3>
          <Button size="sm" onClick={onCreateTask} className="h-8 px-3">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="today" className="flex items-center gap-2 text-xs">
              <Calendar className="h-4 w-4" />
              Today ({todaysTasks.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex items-center gap-2 text-xs">
              <Clock className="h-4 w-4" />
              Upcoming ({upcomingTasks.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="today" className="space-y-2 max-h-60 overflow-y-auto">
            {todaysTasks.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No tasks for today
              </div>
            ) : (
              todaysTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="scale-95 origin-top">
                  <TaskCard task={task} onTaskUpdate={onEditTask} />
                </div>
              ))
            )}
            {todaysTasks.length > 3 && (
              <div className="text-center py-2">
                <Button variant="ghost" size="sm" className="text-xs">
                  View {todaysTasks.length - 3} more
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="upcoming" className="space-y-2 max-h-60 overflow-y-auto">
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No upcoming tasks
              </div>
            ) : (
              upcomingTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="scale-95 origin-top">
                  <TaskCard task={task} onTaskUpdate={onEditTask} />
                </div>
              ))
            )}
            {upcomingTasks.length > 3 && (
              <div className="text-center py-2">
                <Button variant="ghost" size="sm" className="text-xs">
                  View {upcomingTasks.length - 3} more
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
