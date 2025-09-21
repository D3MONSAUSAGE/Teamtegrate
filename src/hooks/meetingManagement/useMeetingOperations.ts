import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMeeting } from '@/contexts/meeting';

export const useMeetingOperations = (refetchMeetings: () => void) => {
  const { user } = useAuth();
  const meetingContext = useMeeting();
  const [isLoading, setIsLoading] = useState(false);

  const createMeeting = async (
    title: string,
    description: string,
    startTime: Date,
    endTime: Date,
    participantIds: string[],
    location?: string
  ) => {
    if (!user || !meetingContext) return null;

    setIsLoading(true);
    try {
      const result = await meetingContext.createMeeting(
        title,
        description,
        startTime,
        endTime,
        participantIds,
        location
      );
      refetchMeetings();
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const updateMeeting = async (
    meetingId: string,
    title: string,
    description: string,
    startTime: Date,
    endTime: Date,
    participantIds: string[],
    location?: string
  ) => {
    if (!user || !meetingContext) return false;

    setIsLoading(true);
    try {
      const result = await meetingContext.updateMeeting(
        meetingId,
        title,
        description,
        startTime,
        endTime,
        participantIds,
        location
      );
      refetchMeetings();
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelMeeting = async (meetingId: string) => {
    if (!user || !meetingContext) return null;

    setIsLoading(true);
    try {
      const result = await meetingContext.cancelMeeting(meetingId);
      refetchMeetings();
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const respondToMeeting = async (
    participantId: string,
    response: 'accepted' | 'declined' | 'tentative'
  ) => {
    if (!user || !meetingContext) return;

    setIsLoading(true);
    try {
      await meetingContext.respondToMeeting(participantId, response);
      refetchMeetings();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createMeeting,
    updateMeeting,
    cancelMeeting,
    respondToMeeting
  };
};