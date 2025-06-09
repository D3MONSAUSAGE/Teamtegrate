
import { useState, useCallback } from 'react';
import { Task } from '@/types';

export const useSessionManagement = (selectedTask: Task | null) => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Generate unique session ID
  const generateSessionId = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const taskId = selectedTask?.id || 'unknown';
    return `${taskId}-${timestamp}-${random}`;
  }, [selectedTask?.id]);

  return {
    sessionId,
    setSessionId,
    generateSessionId
  };
};
