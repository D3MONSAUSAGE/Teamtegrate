import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Plus,
  Target,
  TrendingUp,
  UserPlus
} from 'lucide-react';
import { format } from 'date-fns';

export interface DailyTaskDetail {
  task_id: string;
  title: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'To Do' | 'In Progress' | 'Completed' | 'Archived';
  deadline: string;
  created_at: string;
  completed_at?: string;
  project_title?: string;
}

export interface DailyDetailData {
  date: string;
  completion_score: number;
  completed_tasks: DailyTaskDetail[];
  created_tasks: DailyTaskDetail[];
  assigned_tasks: (DailyTaskDetail & {
    assigned_to_name?: string;
    assigned_by_name?: string;
  })[];
  overdue_tasks: DailyTaskDetail[];
  pending_tasks: DailyTaskDetail[];
  total_tasks: number;
  high_priority_count: number;
  medium_priority_count: number;
  low_priority_count: number;
}

interface DailyTaskDetailViewProps {
  data: DailyDetailData | null;
  isLoading: boolean;
  selectedDate: string | null;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High': return 'destructive';
    case 'Medium': return 'default';
    case 'Low': return 'secondary';
    default: return 'outline';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'In Progress': return <Clock className="h-4 w-4 text-blue-500" />;
    case 'To Do': return <Target className="h-4 w-4 text-gray-500" />;
    default: return <AlertTriangle className="h-4 w-4 text-orange-500" />;
  }
};

export const DailyTaskDetailView: React.FC<DailyTaskDetailViewProps> = ({
  data,
  isLoading,
  selectedDate
}) => {
  if (!selectedDate) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Select a Day to View Details
          </h3>
          <p className="text-sm text-muted-foreground">
            Click on any bar in the daily completion chart to see detailed task information for that day.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {format(new Date(selectedDate), 'EEEE, MMMM do, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {format(new Date(selectedDate), 'EEEE, MMMM do, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No Task Data Available
            </h3>
            <p className="text-sm text-muted-foreground">
              No tasks found for the selected date.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const TaskList = ({ tasks, title, icon, showAssignmentInfo = false }: { 
    tasks: (DailyTaskDetail & { assigned_to_name?: string; assigned_by_name?: string; })[]; 
    title: string; 
    icon: React.ReactNode;
    showAssignmentInfo?: boolean;
  }) => (
    <div className="space-y-3">
      <h4 className="font-medium flex items-center gap-2">
        {icon}
        {title} ({tasks.length})
      </h4>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground ml-6">No tasks</p>
      ) : (
        <div className="space-y-2 ml-6">
          {tasks.map((task) => (
            <div key={task.task_id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(task.status)}
                <div>
                  <p className="font-medium text-sm">{task.title}</p>
                  {task.project_title && (
                    <p className="text-xs text-muted-foreground">{task.project_title}</p>
                  )}
                  {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                  )}
                  {showAssignmentInfo && 'assigned_to_name' in task && task.assigned_to_name && (
                    <p className="text-xs text-purple-600">Assigned to: {task.assigned_to_name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                  {task.priority}
                </Badge>
                {task.completed_at && (
                  <span className="text-xs text-green-600">
                    ✓ {format(new Date(task.completed_at), 'HH:mm')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardContent className="space-y-6">

        {/* Priority Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium">Priority Distribution</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">High Priority</span>
              <div className="flex items-center gap-2">
                <Progress value={(data.high_priority_count / data.total_tasks) * 100} className="w-20 h-2" />
                <span className="text-sm font-medium">{data.high_priority_count}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Medium Priority</span>
              <div className="flex items-center gap-2">
                <Progress value={(data.medium_priority_count / data.total_tasks) * 100} className="w-20 h-2" />
                <span className="text-sm font-medium">{data.medium_priority_count}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Low Priority</span>
              <div className="flex items-center gap-2">
                <Progress value={(data.low_priority_count / data.total_tasks) * 100} className="w-20 h-2" />
                <span className="text-sm font-medium">{data.low_priority_count}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Task Lists */}
        <div className="space-y-6">
          <TaskList 
            tasks={data.completed_tasks} 
            title="Completed Tasks" 
            icon={<CheckCircle className="h-4 w-4 text-green-500" />}
          />
          
          <TaskList 
            tasks={data.created_tasks} 
            title="Tasks Created Today" 
            icon={<Plus className="h-4 w-4 text-blue-500" />}
          />
          
          <TaskList 
            tasks={data.assigned_tasks} 
            title="Tasks Assigned Today" 
            icon={<UserPlus className="h-4 w-4 text-purple-500" />}
            showAssignmentInfo={true}
          />
          
          <TaskList 
            tasks={data.overdue_tasks} 
            title="Overdue Tasks" 
            icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}
          />
          
          <TaskList 
            tasks={data.pending_tasks} 
            title="Pending Tasks" 
            icon={<Clock className="h-4 w-4 text-gray-500" />}
          />
        </div>
      </CardContent>
    </Card>
  );
};