import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useMeetingData } from './meetingManagement/useMeetingData';
import { useMeetingOperations } from './meetingManagement/useMeetingOperations';
import { useMeetingFilters } from './meetingManagement/useMeetingFilters';
import { useMeetingSync } from './meetingManagement/useMeetingSync';

export const useEnhancedMeetingManagement = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { meetings, isLoading: meetingsLoading, error } = useMeetingData();

  const refetchMeetings = () => {
    queryClient.invalidateQueries({ queryKey: ['meetings'] });
    queryClient.invalidateQueries({ queryKey: ['meeting-requests'] });
    queryClient.invalidateQueries({ queryKey: ['my-meetings'] });
  };

  const { 
    isLoading: operationsLoading,
    createMeeting,
    updateMeeting,
    cancelMeeting,
    respondToMeeting
  } = useMeetingOperations(refetchMeetings);

  const {
    filters,
    filteredMeetings,
    updateFilters,
    resetFilters,
    meetingCounts
  } = useMeetingFilters(meetings);

  const {
    isLoading: syncLoading,
    syncMeetingToGoogle
  } = useMeetingSync(refetchMeetings);

  const isOrganizer = (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    return meeting?.organizer_id === currentUser?.id;
  };

  const isParticipant = (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    return meeting?.participants.some(p => p.user_id === currentUser?.id);
  };

  return {
    meetings,
    filteredMeetings,
    isLoading: meetingsLoading || operationsLoading || syncLoading,
    error,
    
    // CRUD operations
    createMeeting: (
      title: string,
      description: string,
      startTime: Date,
      endTime: Date,
      participantIds: string[],
      location?: string
    ) => createMeeting(title, description, startTime, endTime, participantIds, location),
    
    updateMeeting: (
      meetingId: string,
      title: string,
      description: string,
      startTime: Date,
      endTime: Date,
      participantIds: string[],
      location?: string
    ) => updateMeeting(meetingId, title, description, startTime, endTime, participantIds, location),
    
    cancelMeeting,
    respondToMeeting,
    
    // Google Calendar sync
    syncMeetingToGoogle,
    
    // Filtering
    filters,
    updateFilters,
    resetFilters,
    meetingCounts,
    
    // Utilities
    refetchMeetings,
    isOrganizer,
    isParticipant
  };
};