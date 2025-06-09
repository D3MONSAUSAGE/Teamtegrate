import React, { useState } from 'react';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import FocusTaskSelector from '@/components/focus/FocusTaskSelector';
import FocusTimer from '@/components/focus/FocusTimer';
import GrowthAnimation from '@/components/focus/GrowthAnimation';
import FocusSettings from '@/components/focus/FocusSettings';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Clock, Leaf } from 'lucide-react';

export type FocusSession = {
  id: string;
  taskId: string;
  duration: number;
  timeRemaining: number;
  isActive: boolean;
  isPaused: boolean;
  progress: number;
};

const FocusZonePage = () => {
  const { tasks } = useTask();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [focusSession, setFocusSession] = useState<FocusSession | null>(null);
  const [focusDuration, setFocusDuration] = useState(25); // Default 25 minutes
  const [animationType, setAnimationType] = useState<'tree' | 'flower' | 'city'>('tree');

  const availableTasks = tasks.filter(task => 
    task.status !== 'Completed'
  );

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
  };

  const handleTimerUpdate = (session: FocusSession) => {
    setFocusSession(session);
  };

  const handleSessionComplete = () => {
    // Session completed logic
    setFocusSession(null);
    setSelectedTask(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Focus Zone
          </h1>
        </div>
        <p className="text-muted-foreground">
          Select a task, set your timer, and watch your progress grow as you focus.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4 glass-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available Tasks</p>
              <p className="text-2xl font-bold">{availableTasks.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 glass-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Target className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Focus Duration</p>
              <p className="text-2xl font-bold">{focusDuration}min</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 glass-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Leaf className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Status</p>
              <Badge variant={focusSession?.isActive ? "default" : "secondary"}>
                {focusSession?.isActive ? "Focusing" : "Ready"}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Selection */}
        <div className="lg:col-span-1">
          <FocusTaskSelector 
            tasks={availableTasks}
            selectedTask={selectedTask}
            onTaskSelect={handleTaskSelect}
          />
          
          <div className="mt-6">
            <FocusSettings
              duration={focusDuration}
              onDurationChange={setFocusDuration}
              animationType={animationType}
              onAnimationTypeChange={setAnimationType}
            />
          </div>
        </div>

        {/* Timer and Animation */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timer */}
            <div>
              <FocusTimer
                selectedTask={selectedTask}
                duration={focusDuration}
                onSessionUpdate={handleTimerUpdate}
                onSessionComplete={handleSessionComplete}
              />
            </div>

            {/* Growth Animation */}
            <div>
              <GrowthAnimation
                progress={focusSession?.progress || 0}
                animationType={animationType}
                isActive={focusSession?.isActive || false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusZonePage;
