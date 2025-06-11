import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTask } from '@/contexts/task';
import { Task } from '@/types';

const AnalyticsSection: React.FC = () => {
  const { tasks } = useTask();
  
  // Use tasks directly without conversion
  const taskList = tasks as Task[];
  
  // Calculate total number of tasks
  const totalTasks = taskList.length;
  
  // Calculate number of completed tasks
  const completedTasks = taskList.filter(task => task.status === 'Completed').length;
  
  // Calculate percentage of completed tasks
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTasks}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Completed Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedTasks}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionPercentage.toFixed(1)}%</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsSection;
