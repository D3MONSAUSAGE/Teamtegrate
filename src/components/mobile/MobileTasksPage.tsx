
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from './MobileLayout';
import PullToRefresh from './PullToRefresh';
import SwipeableTaskCard from './SwipeableTaskCard';
import FloatingActionButton from './FloatingActionButton';
import { useTask } from '@/contexts/task/TaskContext';
import { Task } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const MobileTasksPage: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, refreshTasks, updateTaskStatus } = useTask();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (activeTab) {
      case 'todo':
        return matchesSearch && task.status === 'To Do';
      case 'progress':
        return matchesSearch && task.status === 'In Progress';
      case 'completed':
        return matchesSearch && task.status === 'Completed';
      default:
        return matchesSearch;
    }
  });

  const handleTaskPress = (task: Task) => {
    navigate(`/tasks/${task.id}`);
  };

  const handleNewTask = () => {
    navigate('/tasks?action=new');
  };

  const handleRefresh = async () => {
    await refreshTasks();
  };

  const getTabCount = (status?: string) => {
    if (!status) return tasks.length;
    return tasks.filter(task => task.status === status).length;
  };

  return (
    <MobileLayout>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen bg-background">
          {/* Header */}
          <div className="bg-background/95 backdrop-blur-sm border-b border-border/50 pt-safe-area-inset-top">
            <div className="px-4 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 rounded-full"
                >
                  <Filter className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 rounded-full bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="all" className="relative">
                  All
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {getTabCount()}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="todo" className="relative">
                  To Do
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {getTabCount('To Do')}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="progress" className="relative">
                  Active
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {getTabCount('In Progress')}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="completed" className="relative">
                  Done
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {getTabCount('Completed')}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-3">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No tasks found</p>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <SwipeableTaskCard
                      key={task.id}
                      task={task}
                      onEdit={handleTaskPress}
                      onStatusChange={updateTaskStatus}
                      onDelete={() => {/* TODO: Implement delete */}}
                      onClick={() => handleTaskPress(task)}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </PullToRefresh>

      {/* Floating Action Button */}
      <FloatingActionButton
        onCreateTask={handleNewTask}
      />
    </MobileLayout>
  );
};

export default MobileTasksPage;
