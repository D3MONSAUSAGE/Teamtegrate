import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  FolderOpen,
  Filter,
  Search,
  Download,
  TrendingUp,
  Target,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { DetailedTask } from '@/hooks/useEmployeeDetailedTasks';

interface WeeklyDetailedTasksProps {
  allTasks: DetailedTask[];
  todoTasks: DetailedTask[];
  inProgressTasks: DetailedTask[];
  completedTasks: DetailedTask[];
  overdueTasks: DetailedTask[];
  tasksByProject: Record<string, DetailedTask[]>;
  totalTimeSpent: number;
  summary: {
    total: number;
    todo: number;
    inProgress: number;
    completed: number;
    overdue: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
  };
  isLoading: boolean;
}

export const WeeklyDetailedTasks: React.FC<WeeklyDetailedTasksProps> = ({
  allTasks,
  todoTasks,
  inProgressTasks,
  completedTasks,
  overdueTasks,
  tasksByProject,
  totalTimeSpent,
  summary,
  isLoading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    let tasks = allTasks;
    
    // Filter by tab
    switch (activeTab) {
      case 'todo':
        tasks = todoTasks;
        break;
      case 'inprogress':
        tasks = inProgressTasks;
        break;
      case 'completed':
        tasks = completedTasks;
        break;
      case 'overdue':
        tasks = overdueTasks;
        break;
      default:
        tasks = allTasks;
    }
    
    // Apply search filter
    if (searchQuery) {
      tasks = tasks.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        task.project_title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      tasks = tasks.filter(task => task.priority === priorityFilter);
    }
    
    // Apply project filter
    if (projectFilter !== 'all') {
      tasks = tasks.filter(task => task.project_title === projectFilter);
    }
    
    return tasks;
  }, [allTasks, todoTasks, inProgressTasks, completedTasks, overdueTasks, searchQuery, priorityFilter, projectFilter, activeTab]);

  // Get priority badge variant
  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'outline';
    }
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'In Progress': return 'secondary';
      case 'To Do': return 'outline';
      default: return 'outline';
    }
  };

  // Format time duration
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Get project options for filter
  const projectOptions = useMemo(() => {
    const projects = Object.keys(tasksByProject).sort();
    return projects;
  }, [tasksByProject]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detailed Task Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{summary.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{summary.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{summary.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Time Spent</p>
                <p className="text-2xl font-bold">{formatTime(totalTimeSpent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projectOptions.map(project => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">
                All ({summary.total})
              </TabsTrigger>
              <TabsTrigger value="todo">
                To Do ({summary.todo})
              </TabsTrigger>
              <TabsTrigger value="inprogress">
                In Progress ({summary.inProgress})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({summary.completed})
              </TabsTrigger>
              <TabsTrigger value="overdue">
                Overdue ({summary.overdue})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tasks found matching your criteria.
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <Card key={task.task_id} className={`transition-colors ${task.is_overdue ? 'border-destructive/50' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{task.title}</h3>
                              {task.is_overdue && (
                                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                              )}
                            </div>
                            
                            {task.description && (
                              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge variant={getPriorityVariant(task.priority)}>
                                {task.priority}
                              </Badge>
                              <Badge variant={getStatusVariant(task.status)}>
                                {task.status}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <FolderOpen className="h-3 w-3" />
                                {task.project_title}
                              </Badge>
                            </div>
                            
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              {task.deadline && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Due: {format(new Date(task.deadline), 'MMM dd, yyyy')}</span>
                                  {task.days_until_due !== null && (
                                    <span className={task.is_overdue ? 'text-destructive' : ''}>
                                      ({task.days_until_due > 0 ? `${task.days_until_due} days left` : 
                                        task.days_until_due === 0 ? 'Due today' : 
                                        `${Math.abs(task.days_until_due)} days overdue`})
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>Time: {formatTime(task.time_spent_minutes)}</span>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4" />
                                <span>Created: {format(new Date(task.created_at), 'MMM dd')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};