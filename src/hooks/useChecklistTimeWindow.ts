import { useState, useEffect } from 'react';
import { getChecklistTimeWindowStatus, TimeWindowStatus } from '@/utils/checklistTimeUtils';
import { Checklist, ChecklistExecution } from '@/types/checklist';

/**
 * Hook for real-time tracking of checklist time window status with countdown
 */
export const useChecklistTimeWindow = (
  checklist: Checklist | ChecklistExecution['checklist'] | null,
  executionDate?: string,
  updateInterval: number = 60000 // Update every minute by default
): TimeWindowStatus & { countdown: string } => {
  const [timeStatus, setTimeStatus] = useState<TimeWindowStatus>(() => 
    getChecklistTimeWindowStatus(checklist, executionDate)
  );
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (!checklist) {
      setTimeStatus({
        isInWindow: false,
        isBeforeWindow: false,
        isAfterWindow: false,
        status: 'no-window',
        message: 'No checklist available'
      });
      setCountdown('');
      return;
    }

    const updateStatus = () => {
      const newStatus = getChecklistTimeWindowStatus(checklist, executionDate);
      setTimeStatus(newStatus);

      // Update countdown text
      if (newStatus.timeUntilAvailable && newStatus.timeUntilAvailable > 0) {
        const hours = Math.floor(newStatus.timeUntilAvailable / 60);
        const minutes = newStatus.timeUntilAvailable % 60;
        setCountdown(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
      } else if (newStatus.timeUntilExpired && newStatus.timeUntilExpired > 0) {
        const hours = Math.floor(newStatus.timeUntilExpired / 60);
        const minutes = newStatus.timeUntilExpired % 60;
        setCountdown(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
      } else {
        setCountdown('');
      }
    };

    // Initial update
    updateStatus();

    // Set up interval for real-time updates
    const interval = setInterval(updateStatus, updateInterval);

    return () => clearInterval(interval);
  }, [checklist, executionDate, updateInterval]);

  return { ...timeStatus, countdown };
};

/**
 * Hook for checking multiple executions' time window status
 */
export const useMultipleChecklistTimeWindows = (
  executions: ChecklistExecution[] = []
): Record<string, TimeWindowStatus> => {
  const [statuses, setStatuses] = useState<Record<string, TimeWindowStatus>>({});

  useEffect(() => {
    const updateStatuses = () => {
      const newStatuses: Record<string, TimeWindowStatus> = {};
      
      executions.forEach((execution) => {
        newStatuses[execution.id] = getChecklistTimeWindowStatus(
          execution.checklist,
          execution.execution_date
        );
      });
      
      setStatuses(newStatuses);
    };

    updateStatuses();

    // Update every minute
    const interval = setInterval(updateStatuses, 60000);

    return () => clearInterval(interval);
  }, [executions]);

  return statuses;
};