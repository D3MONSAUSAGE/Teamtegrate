import { useState, useEffect } from 'react';

interface ProgressiveLoadingState {
  scheduleReady: boolean;
  timeTrackingReady: boolean;
  teamDataReady: boolean;
  allReady: boolean;
}

export const useProgressiveLoading = () => {
  const [loadingPhase, setLoadingPhase] = useState<'schedule' | 'secondary' | 'complete'>('schedule');
  const [state, setState] = useState<ProgressiveLoadingState>({
    scheduleReady: false,
    timeTrackingReady: false,
    teamDataReady: false,
    allReady: false
  });

  // Mark schedule as ready and trigger secondary loading
  const markScheduleReady = () => {
    setState(prev => ({ ...prev, scheduleReady: true }));
    setLoadingPhase('secondary');
  };

  // Mark time tracking as ready
  const markTimeTrackingReady = () => {
    setState(prev => ({ ...prev, timeTrackingReady: true }));
  };

  // Mark team data as ready
  const markTeamDataReady = () => {
    setState(prev => ({ ...prev, teamDataReady: true }));
  };

  // Check if all secondary loading is complete
  useEffect(() => {
    if (state.scheduleReady && state.timeTrackingReady && state.teamDataReady) {
      setState(prev => ({ ...prev, allReady: true }));
      setLoadingPhase('complete');
    }
  }, [state.scheduleReady, state.timeTrackingReady, state.teamDataReady]);

  return {
    loadingPhase,
    state,
    actions: {
      markScheduleReady,
      markTimeTrackingReady,
      markTeamDataReady
    },
    // Helper flags for conditional hook activation
    shouldLoadSchedule: true, // Always load schedule first
    shouldLoadTimeTracking: loadingPhase !== 'schedule',
    shouldLoadTeamData: loadingPhase !== 'schedule'
  };
};