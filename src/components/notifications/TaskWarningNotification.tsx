import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/task';
import { isTaskInWarningPeriod, isTaskOverdue } from '@/utils/taskUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface TaskWarningNotificationProps {
  children: React.ReactNode;
}

const TaskWarningNotification: React.FC<TaskWarningNotificationProps> = ({ children }) => {
  const { user } = useAuth();
  const { tasks } = useTask();

  useEffect(() => {
    if (!user || !tasks.length) return;

    const checkTaskWarnings = () => {
      tasks.forEach(task => {
        if (task.status === 'Completed') return;
        
        // Check if task just entered warning period
        const wasInWarning = localStorage.getItem(`task-warning-${task.id}`);
        const isCurrentlyInWarning = isTaskInWarningPeriod(task);
        const isCurrentlyOverdue = isTaskOverdue(task);
        
        if (isCurrentlyInWarning && !isCurrentlyOverdue && !wasInWarning) {
          // Task just entered warning period
          localStorage.setItem(`task-warning-${task.id}`, 'true');
          
          // Send notification to database
          const sendNotification = async () => {
            try {
              await supabase
                .from('notifications')
                .insert({
                  user_id: user.id,
                  title: 'Task Due Soon',
                  content: `Task "${task.title}" is approaching its deadline`,
                  type: 'task_warning',
                  task_id: task.id,
                  organization_id: user.organizationId
                });
              
              // Show toast notification
              toast.warning(`Task "${task.title}" is due soon!`, {
                description: 'Check your tasks to stay on track'
              });
            } catch (error) {
              console.error('Failed to send warning notification:', error);
            }
          };
          
          sendNotification();
        } else if (!isCurrentlyInWarning || isCurrentlyOverdue) {
          // Task left warning period or became overdue
          localStorage.removeItem(`task-warning-${task.id}`);
        }
      });
    };

    // Check immediately
    checkTaskWarnings();
    
    // Check every minute
    const interval = setInterval(checkTaskWarnings, 60000);
    
    return () => clearInterval(interval);
  }, [tasks, user]);

  return <>{children}</>;
};

export default TaskWarningNotification;