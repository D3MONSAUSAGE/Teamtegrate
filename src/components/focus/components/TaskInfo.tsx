
import React from 'react';
import { Task } from '@/types';

interface TaskInfoProps {
  selectedTask: Task;
}

const TaskInfo: React.FC<TaskInfoProps> = ({ selectedTask }) => {
  return (
    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-border/50">
      <p className="text-sm text-muted-foreground mb-1">Focusing on:</p>
      <p className="font-medium text-foreground">{selectedTask.title}</p>
    </div>
  );
};

export default TaskInfo;
