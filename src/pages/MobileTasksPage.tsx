
import React, { useState, useCallback } from 'react';
import { usePersonalTasks } from '@/hooks/usePersonalTasks';
import { Task, TaskStatus } from '@/types';
import { Filter, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EnhancedCreateTaskDialog from '@/components/task/EnhancedCreateTaskDialog';
import { useTask } from '@/contexts/task';
import { useTaskRealtime } from '@/hooks/useTaskRealtime';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import SwipeableTaskCard from '@/components/mobile/SwipeableTaskCard';
import FloatingActionButton from '@/components/mobile/FloatingActionButton';
import SkeletonCard from '@/components/mobile/SkeletonCard';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MobileTasksPage = () => {
  useTaskRealtime();
  
  const { tasks, isLoading, refetch } = usePersonalTasks();
  const { updateTaskStatus } = useTask();
  
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  // Filter tasks based on search and status
  const filteredTasks = React.useMemo(() => {
    let filtered = tasks;

    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Sort by deadline
    return filtered.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [tasks, searchQuery, statusFilter]);

  // Group tasks by status
  const taskGroups = React.useMemo(() => {
    const groups = {
      'To Do': filteredTasks.filter(task => task.status === 'To Do'),
      'In Progress': filteredTasks.filter(task => task.status === 'In Progress'),
      'Completed': filteredTasks.filter(task => task.status === 'Completed')
    };
    return groups;
  }, [filteredTasks]);

  const handlePullToRefresh = useCallback(async () => {
    try {
      await refetch();
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Pull to refresh failed:', error);
    }
  }, [refetch]);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  }, []);

  const handleCreateTask = useCallback(() => {
    setEditingTask(undefined);
    setIsCreateTaskOpen(true);
  }, []);

  const handleTaskDialogComplete = useCallback(() => {
    setIsCreateTaskOpen(false);
    setEditingTask(undefined);
    refetch();
  }, [refetch]);

  const onStatusChange = async (taskId: string, status: string): Promise<void> => {
    try {
      setIsUpdatingStatus(taskId);
      
      const validStatuses = ['To Do', 'In Progress', 'Completed'];
      if (!validStatuses.includes(status)) {
        toast.error('Invalid status selected');
        return;
      }

      await updateTaskStatus(taskId, status as Task['status']);
      toast.success(`Task status updated to ${status}`);
      await refetch();
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to update task status. Please try again.');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const statusColors = {
    'To Do': 'bg-gray-500',
    'In Progress': 'bg-blue-500',
    'Completed': 'bg-green-500'
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} variant="task" />
        ))}
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handlePullToRefresh}>
      <div className="min-h-screen bg-background">
        <div className="p-4 space-y-4">
          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All ({tasks.length})
              </Button>
              {Object.entries(taskGroups).map(([status, statusTasks]) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="whitespace-nowrap"
                >
                  {status} ({statusTasks.length})
                </Button>
              ))}
            </div>
          </div>

          {/* Tasks by Status */}
          {Object.entries(taskGroups).map(([status, statusTasks]) => {
            if (statusTasks.length === 0) return null;

            return (
              <Card key={status} className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", statusColors[status as keyof typeof statusColors])} />
                    {status}
                    <Badge variant="secondary" className="ml-auto">
                      {statusTasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {statusTasks.map((task) => (
                    <SwipeableTaskCard
                      key={task.id}
                      task={task}
                      onEdit={handleEditTask}
                      onStatusChange={onStatusChange}
                      onDelete={() => {}}
                      onClick={() => {}}
                      isUpdating={isUpdatingStatus === task.id}
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })}

          {/* Empty State */}
          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No tasks found</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={handleCreateTask}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </div>
            </div>
          )}

          {/* Bottom padding for tab bar */}
          <div className="h-4" />
        </div>

        {/* Floating Action Button */}
        <FloatingActionButton
          onCreateTask={handleCreateTask}
          onStartTimer={() => {}}
        />

        {/* Create Task Dialog */}
        <EnhancedCreateTaskDialog 
          open={isCreateTaskOpen} 
          onOpenChange={setIsCreateTaskOpen}
          editingTask={editingTask}
          onTaskComplete={handleTaskDialogComplete}
        />
      </div>
    </PullToRefresh>
  );
};

export default MobileTasksPage;
