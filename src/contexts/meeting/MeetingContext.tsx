import React, { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MeetingRequestWithParticipants } from '@/types/meeting';
import { useAuth } from '@/contexts/AuthContext';
import { MeetingContextType } from './index';
import { 
  fetchMeetingRequestsAPI,
  createMeetingRequestAPI,
  updateMeetingAPI,
  cancelMeetingAPI,
  respondToMeetingAPI,
  syncMeetingToGoogleAPI
} from './api';

export const MeetingContext = React.createContext<MeetingContextType | undefined>(undefined);

export const MeetingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [meetings, setMeetings] = useState<MeetingRequestWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to invalidate meeting-related caches
  const invalidateMeetingCaches = useCallback(async () => {
    const cacheKeys = [
      ['meetings'],
      ['meeting-requests'],
      ['my-meetings'],
      ['meeting-requests', user?.organizationId, user?.id]
    ];

    await Promise.all(
      cacheKeys.map(key => queryClient.invalidateQueries({ queryKey: key }))
    );
  }, [queryClient, user?.organizationId, user?.id]);

  const fetchMeetings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const fetchedMeetings = await fetchMeetingRequestsAPI(user);
      setMeetings(fetchedMeetings);
    } catch (err: any) {
      console.error('Error fetching meetings:', err);
      setError(err.message || 'Failed to fetch meetings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshMeetings = useCallback(async () => {
    await fetchMeetings();
    await invalidateMeetingCaches();
  }, [fetchMeetings, invalidateMeetingCaches]);

  const createMeeting = useCallback(async (
    title: string,
    description: string,
    startTime: Date,
    endTime: Date,
    participantIds: string[],
    location?: string
  ) => {
    if (!user) return null;

    try {
      const meeting = await createMeetingRequestAPI({
        title,
        description,
        startTime,
        endTime,
        participantIds,
        location,
        user
      });

      if (meeting) {
        await refreshMeetings();
      }
      
      return meeting;
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  }, [user, refreshMeetings]);

  const updateMeeting = useCallback(async (
    meetingId: string,
    title: string,
    description: string,
    startTime: Date,
    endTime: Date,
    participantIds: string[],
    location?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const success = await updateMeetingAPI({
        meetingId,
        title,
        description,
        startTime,
        endTime,
        participantIds,
        location,
        user,
        currentMeetings: meetings
      });

      if (success) {
        await refreshMeetings();
      }

      return success;
    } catch (error) {
      console.error('Error updating meeting:', error);
      throw error;
    }
  }, [user, meetings, refreshMeetings]);

  const cancelMeeting = useCallback(async (meetingId: string) => {
    if (!user) return null;

    try {
      const success = await cancelMeetingAPI({
        meetingId,
        user,
        meetings
      });

      if (success) {
        await refreshMeetings();
      }

      return success;
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      throw error;
    }
  }, [user, meetings, refreshMeetings]);

  const respondToMeeting = useCallback(async (
    participantId: string, 
    response: 'accepted' | 'declined' | 'tentative'
  ) => {
    try {
      // Optimistic update
      setMeetings(prev => prev.map(meeting => ({
        ...meeting,
        participants: meeting.participants.map(participant => 
          participant.id === participantId 
            ? { ...participant, response_status: response, responded_at: new Date().toISOString() }
            : participant
        )
      })));

      await respondToMeetingAPI({
        participantId,
        response,
        user,
        meetings
      });
    } catch (error) {
      console.error('Error responding to meeting:', error);
      // Revert optimistic update on error
      await fetchMeetings();
      throw error;
    }
  }, [user, meetings, fetchMeetings]);

  const syncMeetingToGoogle = useCallback(async (
    meetingId: string, 
    action: 'create' | 'update' | 'delete' = 'create'
  ) => {
    if (!user) return false;

    try {
      const success = await syncMeetingToGoogleAPI({
        meetingId,
        action,
        user
      });

      if (success) {
        await refreshMeetings();
      }

      return success;
    } catch (error) {
      console.error('Error syncing meeting to Google:', error);
      return false;
    }
  }, [user, refreshMeetings]);

  // Fetch meetings when user changes
  useEffect(() => {
    if (user) {
      fetchMeetings();
    }
  }, [user, fetchMeetings]);

  const value: MeetingContextType = {
    meetings,
    loading,
    error,
    fetchMeetings,
    refreshMeetings,
    createMeeting,
    updateMeeting,
    cancelMeeting,
    respondToMeeting,
    syncMeetingToGoogle
  };

  return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>;
};

export const useMeeting = () => {
  const context = React.useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
};