
import React, { useState } from 'react';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import FocusTaskSelector from '@/components/focus/FocusTaskSelector';
import FocusTimer from '@/components/focus/FocusTimer';
import EnhancedGrowthAnimation from '@/components/focus/EnhancedGrowthAnimation';
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
  const [animationType, setAnimationType] = useState<'forest' | 'garden' | 'city' | 'ocean' | 'space'>('forest');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'noon' | 'evening' | 'night'>('noon');

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
    // Session completed logic - only reset the session, keep the selected task
    setFocusSession(null);
    // Don't reset selectedTask - let user start another session with the same task if they want
    console.log('Focus session completed successfully!');
  };

  // Auto-cycle time of day based on real time (optional enhancement)
  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) setTimeOfDay('morning');
    else if (hour >= 12 && hour < 17) setTimeOfDay('noon');
    else if (hour >= 17 && hour < 21) setTimeOfDay('evening');
    else setTimeOfDay('night');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-3 md:p-4 lg:p-6">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20">
            <Target className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Focus Zone
          </h1>
        </div>
        <p className="text-muted-foreground text-xs md:text-sm lg:text-base">
          Select a task, set your timer, and watch your world grow as you focus.
        </p>
      </div>

      {/* Timer and Animation Section - Now at the top */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 lg:gap-6 mb-4 md:mb-6">
        <FocusTimer
          selectedTask={selectedTask}
          duration={focusDuration}
          onSessionUpdate={handleTimerUpdate}
          onSessionComplete={handleSessionComplete}
        />
        <EnhancedGrowthAnimation
          progress={focusSession?.progress || 0}
          animationType={animationType}
          isActive={focusSession?.isActive || false}
          timeOfDay={timeOfDay}
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3 lg:gap-4 mb-4 md:mb-6">
        <Card className="p-2 md:p-3 lg:p-4 glass-card">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 rounded-lg bg-blue-500/20 flex-shrink-0">
              <Clock className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Available Tasks</p>
              <p className="text-lg md:text-xl lg:text-2xl font-bold">{availableTasks.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-2 md:p-3 lg:p-4 glass-card">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 rounded-lg bg-emerald-500/20 flex-shrink-0">
              <Target className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Focus Duration</p>
              <p className="text-lg md:text-xl lg:text-2xl font-bold">{focusDuration}min</p>
            </div>
          </div>
        </Card>

        <Card className="p-2 md:p-3 lg:p-4 glass-card">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 rounded-lg bg-purple-500/20 flex-shrink-0">
              <Leaf className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-purple-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Current Status</p>
              <Badge variant={focusSession?.isActive ? "default" : "secondary"} className="text-xs">
                {focusSession?.isActive ? "Focusing" : "Ready"}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Task Selection and Settings Section - Now at the bottom */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4 lg:gap-6">
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
    </div>
  );
};

export default FocusZonePage;
