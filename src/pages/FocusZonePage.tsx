import React, { useState } from 'react';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import FocusTaskSelector from '@/components/focus/FocusTaskSelector';
import FocusTimer from '@/components/focus/FocusTimer';
import EnhancedGrowthAnimation from '@/components/focus/EnhancedGrowthAnimation';
import FocusSettings from '@/components/focus/FocusSettings';
import { Badge } from '@/components/ui/badge';
import { Target, Clock, Leaf, Sparkles, Timer, Settings, Play } from 'lucide-react';
import ModernSectionCard from '@/components/dashboard/ModernSectionCard';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="p-3 sm:p-6 space-y-8 max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 backdrop-blur-sm">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
                Focus Zone
              </h1>
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select a task, set your timer, and watch your world grow as you focus on what matters most.
          </p>
        </div>

        {/* Timer and Animation Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <ModernSectionCard
            title="Focus Timer"
            subtitle="Track your focused work sessions"
            icon={Timer}
            gradient="from-green-500/10 via-emerald-500/10 to-teal-500/10"
            noPadding
          >
            <div className="p-6">
              <FocusTimer
                selectedTask={selectedTask}
                duration={focusDuration}
                onSessionUpdate={handleTimerUpdate}
                onSessionComplete={handleSessionComplete}
              />
            </div>
          </ModernSectionCard>
          
          <ModernSectionCard
            title="Growth Animation"
            subtitle="Watch your progress come to life"
            icon={Leaf}
            gradient="from-purple-500/10 via-pink-500/10 to-rose-500/10"
            noPadding
          >
            <div className="p-6">
              <EnhancedGrowthAnimation
                progress={focusSession?.progress || 0}
                animationType={animationType}
                isActive={focusSession?.isActive || false}
                timeOfDay={timeOfDay}
              />
            </div>
          </ModernSectionCard>
        </div>

        {/* Stats Section */}
        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <ModernSectionCard
            title="Session Statistics"
            subtitle="Track your focus metrics and progress"
            icon={Target}
            gradient="from-blue-500/10 via-indigo-500/10 to-purple-500/10"
            noPadding
          >
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                  <div className="p-2 rounded-lg bg-blue-500/20 flex-shrink-0">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Available Tasks</p>
                    <p className="text-2xl font-bold">{availableTasks.length}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
                  <div className="p-2 rounded-lg bg-emerald-500/20 flex-shrink-0">
                    <Target className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Focus Duration</p>
                    <p className="text-2xl font-bold">{focusDuration}min</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                  <div className="p-2 rounded-lg bg-purple-500/20 flex-shrink-0">
                    <Leaf className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Current Status</p>
                    <Badge variant={focusSession?.isActive ? "default" : "secondary"} className="text-sm">
                      {focusSession?.isActive ? "Focusing" : "Ready"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </ModernSectionCard>
        </div>

        {/* Task Selection and Settings Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <ModernSectionCard
              title="Task Selection"
              subtitle="Choose a task to focus on"
              icon={Play}
              gradient="from-orange-500/10 via-red-500/10 to-pink-500/10"
            >
              <FocusTaskSelector 
                tasks={availableTasks}
                selectedTask={selectedTask}
                onTaskSelect={handleTaskSelect}
              />
            </ModernSectionCard>
          </div>
          
          <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
            <ModernSectionCard
              title="Focus Settings"
              subtitle="Customize your focus experience"
              icon={Settings}
              gradient="from-cyan-500/10 via-sky-500/10 to-blue-500/10"
            >
              <FocusSettings
                duration={focusDuration}
                onDurationChange={setFocusDuration}
                animationType={animationType}
                onAnimationTypeChange={setAnimationType}
              />
            </ModernSectionCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusZonePage;
