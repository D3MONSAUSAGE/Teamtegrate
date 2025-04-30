
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTask } from '@/contexts/task';
import TaskHeader from './TaskHeader';
import TaskTabs from './TaskTabs';
import { Task, Project } from '@/types';
import CreateTaskDialogWithAI from '../CreateTaskDialogWithAI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Calendar, ChevronLeft, Clock, Filter, List, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const ProjectTasksView = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const { tasks, projects } = useTask();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [sortBy, setSortBy] = useState('deadline');
  const [searchQuery, setSearchQuery] = useState('');

  // Get project details
  const project = projects.find(p => p.id === projectId);
  
  // Filter tasks by project
  const projectTasks = tasks.filter((task) => task.projectId === projectId)
    .filter((task) => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  };

  // Sort tasks based on the selected option
  const sortTasks = (tasksToSort: Task[]) => {
    return [...tasksToSort].sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'priority':
          const priorityValues = { 'High': 0, 'Medium': 1, 'Low': 2 };
          return priorityValues[a.priority] - priorityValues[b.priority];
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'upcoming':
          const now = new Date().getTime();
          const deadlineA = new Date(a.deadline).getTime();
          const deadlineB = new Date(b.deadline).getTime();
          const timeToDeadlineA = deadlineA - now;
          const timeToDeadlineB = deadlineB - now;
          const upcomingA = timeToDeadlineA > 0 ? timeToDeadlineA : Number.MAX_SAFE_INTEGER;
          const upcomingB = timeToDeadlineB > 0 ? timeToDeadlineB : Number.MAX_SAFE_INTEGER;
          return upcomingA - upcomingB;
        default:
          return 0;
      }
    });
  };

  // Filter tasks by status
  const todoTasks = projectTasks.filter((task) => task.status === 'To Do');
  const inProgressTasks = projectTasks.filter((task) => task.status === 'In Progress');
  const pendingTasks = projectTasks.filter((task) => task.status === 'Pending');
  const completedTasks = projectTasks.filter((task) => task.status === 'Completed');

  // Sort filtered tasks
  const sortedTodo = sortTasks(todoTasks);
  const sortedInProgress = sortTasks(inProgressTasks);
  const sortedPending = sortTasks(pendingTasks);
  const sortedCompleted = sortTasks(completedTasks);

  // Calculate project progress
  const calculateProgress = () => {
    const total = projectTasks.length;
    if (total === 0) return 0;
    
    const completed = completedTasks.length;
    return Math.round((completed / total) * 100);
  };

  const progress = calculateProgress();

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <Link to="/dashboard/projects" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Projects
        </Link>
        
        {project ? (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{project.title}</h1>
                <p className="text-muted-foreground mt-1">{project.description}</p>
              </div>
              <Button onClick={() => {
                setEditingTask(undefined);
                setIsCreateTaskOpen(true);
              }}>Create New Task</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xl font-bold">{progress}%</span>
                    <Badge variant={progress === 100 ? "success" : "secondary"}>
                      {project.status}
                    </Badge>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Start Date</p>
                      <p className="font-medium">{format(new Date(project.startDate), 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">End Date</p>
                      <p className="font-medium">{format(new Date(project.endDate), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Task Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col items-center justify-center p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-md">
                      <span className="text-lg font-bold">{todoTasks.length}</span>
                      <span className="text-xs text-muted-foreground">To Do</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-blue-100 dark:bg-blue-900/20 rounded-md">
                      <span className="text-lg font-bold">{inProgressTasks.length}</span>
                      <span className="text-xs text-muted-foreground">In Progress</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-orange-100 dark:bg-orange-900/20 rounded-md">
                      <span className="text-lg font-bold">{pendingTasks.length}</span>
                      <span className="text-xs text-muted-foreground">Pending</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-green-100 dark:bg-green-900/20 rounded-md">
                      <span className="text-lg font-bold">{completedTasks.length}</span>
                      <span className="text-xs text-muted-foreground">Completed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.teamMembers && project.teamMembers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {project.teamMembers.map((memberId) => {
                        const member = tasks.find(task => task.assignedToId === memberId)?.assignedToName || memberId;
                        return (
                          <Avatar key={memberId} className="border">
                            <AvatarFallback>{member.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No team members assigned</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Project Tasks</h1>
            <Button onClick={() => {
              setEditingTask(undefined);
              setIsCreateTaskOpen(true);
            }}>Create New Task</Button>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          <List className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSortBy('deadline')}>
            <Calendar className={`h-4 w-4 ${sortBy === 'deadline' ? 'text-primary' : ''} mr-1`} />
            By Date
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSortBy('priority')}>
            <Filter className={`h-4 w-4 ${sortBy === 'priority' ? 'text-primary' : ''} mr-1`} />
            Priority
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSortBy('created')}>
            <Clock className={`h-4 w-4 ${sortBy === 'created' ? 'text-primary' : ''} mr-1`} />
            Recent
          </Button>
        </div>
      </div>
      
      <TaskTabs
        todoTasks={sortedTodo}
        inProgressTasks={sortedInProgress}
        pendingTasks={sortedPending}
        completedTasks={sortedCompleted}
        onEdit={handleEditTask}
        onNewTask={() => {
          setEditingTask(undefined);
          setIsCreateTaskOpen(true);
        }}
      />
      
      <CreateTaskDialogWithAI
        open={isCreateTaskOpen} 
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        currentProjectId={projectId ?? undefined}
      />
    </div>
  );
};

export default ProjectTasksView;
