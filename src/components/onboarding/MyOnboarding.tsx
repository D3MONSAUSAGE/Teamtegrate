import { useState } from 'react';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  Users, 
  GraduationCap,
  Heart,
  Play,
  Pause,
  Check,
  MessageSquare
} from 'lucide-react';
import { useMyOnboarding, useOnboardingProgress } from '@/hooks/onboarding/useOnboardingInstances';
import { useOnboardingInstanceTasks } from '@/hooks/onboarding/useOnboardingTasks';
import { OnboardingTaskCategory, OnboardingTaskStatus } from '@/types/onboarding';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

export function MyOnboarding() {
  const { user } = useAuth();
  const { data: onboardingInstance, isLoading } = useMyOnboarding();
  const { tasks, updateTaskStatus, addTaskNote, isUpdating } = useOnboardingInstanceTasks(
    onboardingInstance?.id || ''
  );
  const { data: progress } = useOnboardingProgress(onboardingInstance?.id || '');

  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [taskNote, setTaskNote] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-2 bg-muted rounded w-full mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!onboardingInstance) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Onboarding</h3>
          <p className="text-muted-foreground">
            You don't have an active onboarding process. Contact your manager if you believe this is an error.
          </p>
        </CardContent>
      </Card>
    );
  }

  const daysActive = differenceInDays(new Date(), new Date(onboardingInstance.start_date));
  const completionRate = progress ? progress.completionRate : 0;

  const getCategoryIcon = (category: OnboardingTaskCategory) => {
    switch (category) {
      case 'hr_documentation':
        return <FileText className="w-4 h-4" />;
      case 'compliance_training':
        return <GraduationCap className="w-4 h-4" />;
      case 'job_specific_training':
        return <GraduationCap className="w-4 h-4" />;
      case 'culture_engagement':
        return <Heart className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: OnboardingTaskCategory) => {
    switch (category) {
      case 'hr_documentation':
        return 'bg-blue-100 text-blue-800';
      case 'compliance_training':
        return 'bg-purple-100 text-purple-800';
      case 'job_specific_training':
        return 'bg-green-100 text-green-800';
      case 'culture_engagement':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: OnboardingTaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Play className="w-4 h-4 text-blue-600" />;
      case 'blocked':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: OnboardingTaskStatus) => {
    try {
      await updateTaskStatus.mutateAsync({ taskId, status });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleAddNote = async (taskId: string) => {
    if (!taskNote.trim()) return;
    
    try {
      await addTaskNote.mutateAsync({ taskId, notes: taskNote });
      setTaskNote('');
      setSelectedTask(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const overdueTasks = tasks.filter(task => 
    task.due_date && 
    new Date(task.due_date) < new Date() && 
    task.status !== 'completed'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Welcome to the Team, {user?.name}! 👋</h2>
          <p className="text-muted-foreground">
            Complete your onboarding checklist to get fully set up
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <Calendar className="w-4 h-4 mr-2" />
          Day {daysActive + 1} of onboarding
        </Badge>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Your Onboarding Progress
          </CardTitle>
          <CardDescription>
            {onboardingInstance.template?.name || 'Custom Onboarding Process'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span className="font-medium">{Math.round(completionRate)}%</span>
              </div>
              <Progress value={completionRate} className="h-3" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-600">{pendingTasks.length}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{inProgressTasks.length}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
                <div className="text-xs text-muted-foreground">Overdue</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingTasks.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            In Progress ({inProgressTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedTasks.length})
          </TabsTrigger>
          {overdueTasks.length > 0 && (
            <TabsTrigger value="overdue" className="text-red-600">
              Overdue ({overdueTasks.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="pending" className="space-y-3">
          <TaskList 
            tasks={pendingTasks} 
            onUpdateStatus={handleUpdateTaskStatus}
            onOpenNotes={setSelectedTask}
            getCategoryIcon={getCategoryIcon}
            getCategoryColor={getCategoryColor}
            getStatusIcon={getStatusIcon}
            isUpdating={isUpdating}
          />
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-3">
          <TaskList 
            tasks={inProgressTasks} 
            onUpdateStatus={handleUpdateTaskStatus}
            onOpenNotes={setSelectedTask}
            getCategoryIcon={getCategoryIcon}
            getCategoryColor={getCategoryColor}
            getStatusIcon={getStatusIcon}
            isUpdating={isUpdating}
          />
        </TabsContent>

        <TabsContent value="completed" className="space-y-3">
          <TaskList 
            tasks={completedTasks} 
            onUpdateStatus={handleUpdateTaskStatus}
            onOpenNotes={setSelectedTask}
            getCategoryIcon={getCategoryIcon}
            getCategoryColor={getCategoryColor}
            getStatusIcon={getStatusIcon}
            isUpdating={isUpdating}
            readonly
          />
        </TabsContent>

        {overdueTasks.length > 0 && (
          <TabsContent value="overdue" className="space-y-3">
            <TaskList 
              tasks={overdueTasks} 
              onUpdateStatus={handleUpdateTaskStatus}
              onOpenNotes={setSelectedTask}
              getCategoryIcon={getCategoryIcon}
              getCategoryColor={getCategoryColor}
              getStatusIcon={getStatusIcon}
              isUpdating={isUpdating}
              highlight="overdue"
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Notes Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="note">Add a note about your progress or any questions:</Label>
            <Textarea
              id="note"
              value={taskNote}
              onChange={(e) => setTaskNote(e.target.value)}
              placeholder="Enter your note here..."
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedTask(null)}>
                Cancel
              </Button>
              <Button onClick={() => selectedTask && handleAddNote(selectedTask)}>
                Add Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TaskListProps {
  tasks: any[];
  onUpdateStatus: (taskId: string, status: OnboardingTaskStatus) => Promise<void>;
  onOpenNotes: (taskId: string) => void;
  getCategoryIcon: (category: OnboardingTaskCategory) => React.ReactNode;
  getCategoryColor: (category: OnboardingTaskCategory) => string;
  getStatusIcon: (status: OnboardingTaskStatus) => React.ReactNode;
  isUpdating: boolean;
  readonly?: boolean;
  highlight?: 'overdue';
}

function TaskList({ 
  tasks, 
  onUpdateStatus, 
  onOpenNotes,
  getCategoryIcon,
  getCategoryColor,
  getStatusIcon,
  isUpdating,
  readonly = false,
  highlight
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No tasks in this category</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {tasks.map((task) => (
        <Card 
          key={task.id} 
          className={highlight === 'overdue' ? 'border-red-200 bg-red-50' : ''}
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  {getStatusIcon(task.status)}
                  {task.title}
                </CardTitle>
                {task.description && (
                  <CardDescription>{task.description}</CardDescription>
                )}
              </div>
              <Badge 
                variant="secondary" 
                className={getCategoryColor(task.category)}
              >
                <span className="flex items-center gap-1">
                  {getCategoryIcon(task.category)}
                  {task.category.replace('_', ' ')}
                </span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {task.due_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Due {format(new Date(task.due_date), 'MMM d')}
                  </div>
                )}
                <div className="capitalize">
                  Owner: {task.owner_type}
                </div>
              </div>
              {!readonly && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenNotes(task.id)}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  {task.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => onUpdateStatus(task.id, 'in_progress')}
                      disabled={isUpdating}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Start
                    </Button>
                  )}
                  {task.status === 'in_progress' && (
                    <Button
                      size="sm"
                      onClick={() => onUpdateStatus(task.id, 'completed')}
                      disabled={isUpdating}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  )}
                </div>
              )}
            </div>
            {task.notes && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-sm">{task.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export default MyOnboarding;