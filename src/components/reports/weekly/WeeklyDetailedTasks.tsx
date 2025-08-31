import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  Filter,
  Search,
  TrendingUp,
  Target,
  Timer
} from 'lucide-react';
import { format } from 'date-fns';
import { DetailedTask } from '@/hooks/useEmployeeDetailedTasks';

interface WeeklyDetailedTasksProps {
  allTasks: DetailedTask[];
  todoTasks: DetailedTask[];
  inProgressTasks: DetailedTask[];
  completedTasks: DetailedTask[];
  overdueTasks: DetailedTask[];
  projectGroups: Record<string, DetailedTask[]>;
  summary: {
    totalTasks: number;
    completedCount: number;
    overdueCount: number;
    highPriorityCount: number;
    totalTimeSpentHours: number;
    avgTimePerTask: number;
    completionRate: number;
  };
  isLoading: boolean;
}

const TaskCard: React.FC<{ task: DetailedTask }> = ({ task }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-success/10 text-success border-success/20';
      case 'In Progress': return 'bg-primary/10 text-primary border-primary/20';
      case 'To Do': return 'bg-muted/50 text-muted-foreground border-border';
      default: return 'bg-muted/50 text-muted-foreground border-border';
    }
  };

  const formatTimeSpent = (minutes: number) => {
    if (minutes === 0) return 'No time tracked';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const getDaysUntilDueText = (task: DetailedTask) => {
    if (!task.deadline) return null;
    if (task.is_overdue) return 'Overdue';
    if (task.days_until_due === 0) return 'Due today';
    if (task.days_until_due === 1) return 'Due tomorrow';
    if (task.days_until_due && task.days_until_due > 1) return `Due in ${task.days_until_due} days`;
    return null;
  };

  return (
    <Card className="h-full">
      <CardContent className="p-4 space-y-3">
        {/* Header with priority and status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <h4 className="font-medium text-sm leading-tight line-clamp-2">{task.title}</h4>
            <Badge variant={getPriorityColor(task.priority)} className="text-xs">
              {task.priority}
            </Badge>
          </div>
          <Badge className={`text-xs ${getStatusColor(task.status)}`}>
            {task.status}
          </Badge>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Project */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Target className="h-3 w-3" />
          <span className="truncate">{task.project_title}</span>
        </div>

        {/* Time tracking */}
        <div className="flex items-center gap-1 text-xs">
          <Timer className="h-3 w-3 text-muted-foreground" />
          <span className={task.time_spent_minutes > 0 ? 'text-foreground' : 'text-muted-foreground'}>
            {formatTimeSpent(task.time_spent_minutes)}
          </span>
        </div>

        {/* Deadline info */}
        {task.deadline && (
          <div className="flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              {format(new Date(task.deadline), 'MMM dd, yyyy')}
            </span>
            {getDaysUntilDueText(task) && (
              <Badge 
                variant={task.is_overdue ? 'destructive' : 'outline'} 
                className="text-xs ml-1"
              >
                {getDaysUntilDueText(task)}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const WeeklyDetailedTasks: React.FC<WeeklyDetailedTasksProps> = ({
  allTasks,
  todoTasks,
  inProgressTasks,
  completedTasks,
  overdueTasks,
  projectGroups,
  summary,
  isLoading
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = useMemo(() => {
    let tasks = allTasks;

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue') {
        tasks = overdueTasks;
      } else {
        tasks = tasks.filter(task => task.status === statusFilter);
      }
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
      tasks = tasks.filter(task => task.priority === priorityFilter);
    }

    // Filter by project
    if (projectFilter !== 'all') {
      tasks = tasks.filter(task => task.project_title === projectFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tasks = tasks.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.project_title.toLowerCase().includes(query)
      );
    }

    return tasks;
  }, [allTasks, overdueTasks, statusFilter, priorityFilter, projectFilter, searchQuery]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detailed Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const projects = Object.keys(projectGroups);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <div>
                <p className="text-sm font-medium">{summary.completedCount}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-sm font-medium">{summary.overdueCount}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{summary.totalTimeSpentHours}h</p>
                <p className="text-xs text-muted-foreground">Time Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <div>
                <p className="text-sm font-medium">{summary.completionRate}%</p>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="To Do">To Do</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="High">High Priority</SelectItem>
                  <SelectItem value="Medium">Medium Priority</SelectItem>
                  <SelectItem value="Low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Project</label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {(statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all' || searchQuery) && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Showing {filteredTasks.length} of {allTasks.length} tasks
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setProjectFilter('all');
                    setSearchQuery('');
                  }}
                  className="h-7 px-3 text-xs"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {statusFilter === 'all' ? 'All Tasks' : 
             statusFilter === 'overdue' ? 'Overdue Tasks' : 
             `${statusFilter} Tasks`}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({filteredTasks.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-lg mb-2">📋</div>
              <p className="text-sm">
                {allTasks.length === 0 
                  ? 'No tasks found for this period.' 
                  : 'No tasks match the current filters.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => (
                <TaskCard key={task.task_id} task={task} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};