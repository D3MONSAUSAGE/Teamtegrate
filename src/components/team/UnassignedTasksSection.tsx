
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, UserX } from 'lucide-react';
import { Task } from '@/types';

interface UnassignedTasksSectionProps {
  unassignedTasks: Task[];
  onReassignTask?: (taskId: string) => void;
}

const UnassignedTasksSection: React.FC<UnassignedTasksSectionProps> = ({ 
  unassignedTasks, 
  onReassignTask 
}) => {
  if (unassignedTasks.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
          <AlertTriangle className="h-5 w-5" />
          Unassigned Tasks ({unassignedTasks.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-orange-700 dark:text-orange-300">
            These tasks are not properly assigned to current team members and may need attention.
          </p>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {unassignedTasks.slice(0, 5).map((task) => (
              <div 
                key={task.id} 
                className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <UserX className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {task.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {onReassignTask && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onReassignTask(task.id)}
                    className="ml-2 flex-shrink-0"
                  >
                    Reassign
                  </Button>
                )}
              </div>
            ))}
            
            {unassignedTasks.length > 5 && (
              <p className="text-xs text-gray-500 text-center">
                ... and {unassignedTasks.length - 5} more unassigned tasks
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnassignedTasksSection;
