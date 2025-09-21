import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMeeting } from '@/contexts/meeting';

export const useMeetingSync = (refetchMeetings: () => void) => {
  const { user } = useAuth();
  const meetingContext = useMeeting();
  const [isLoading, setIsLoading] = useState(false);

  const syncMeetingToGoogle = async (
    meetingId: string,
    action: 'create' | 'update' | 'delete' = 'create'
  ) => {
    if (!user || !meetingContext) return false;

    setIsLoading(true);
    try {
      const result = await meetingContext.syncMeetingToGoogle(meetingId, action);
      if (result) {
        refetchMeetings();
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    syncMeetingToGoogle
  };
};