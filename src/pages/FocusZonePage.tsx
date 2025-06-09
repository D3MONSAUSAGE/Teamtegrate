
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
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Focus Zone
          </h1>
        </div>
        <p className="text-muted-foreground text-sm md:text-base">
          Select a task, set your timer, and watch your progress grow as you focus.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <Card className="p-3 md:p-4 glass-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 flex-shrink-0">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">Available Tasks</p>
              <p className="text-xl md:text-2xl font-bold">{availableTasks.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-4 glass-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 flex-shrink-0">
              <Target className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">Focus Duration</p>
              <p className="text-xl md:text-2xl font-bold">{focusDuration}min</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-4 glass-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 flex-shrink-0">
              <Leaf className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">Current Status</p>
              <Badge variant={focusSession?.isActive ? "default" : "secondary"} className="text-xs">
                {focusSession?.isActive ? "Focusing" : "Ready"}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        {/* Left Column - Task Selection and Settings */}
        <div className="xl:col-span-1 space-y-4 md:space-y-6">
          <FocusTaskSelector 
            tasks={availableTasks}
            selectedTask={selectedTask}
            onTaskSelect={handleTaskSelect}
          />
          
          <FocusSettings
            duration={focusDuration}
            onDurationChange={setFocusDuration}
            animationType={animationType}
            onAnimationTypeChange={setAnimationType}
          />
        </div>

        {/* Right Column - Timer and Animation */}
        <div className="xl:col-span-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Timer */}
            <div className="order-1">
              <FocusTimer
                selectedTask={selectedTask}
                duration={focusDuration}
                onSessionUpdate={handleTimerUpdate}
                onSessionComplete={handleSessionComplete}
              />
            </div>

            {/* Growth Animation */}
            <div className="order-2">
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
