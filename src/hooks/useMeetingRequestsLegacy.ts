// Legacy compatibility wrapper for components still using useMeetingRequests
// This provides backward compatibility while migrating to the new centralized system

import { useEnhancedMeetingManagement } from './useEnhancedMeetingManagement';

/**
 * @deprecated Use useEnhancedMeetingManagement instead
 * This is a compatibility wrapper that maintains the old API
 */
export const useMeetingRequests = () => {
  const enhanced = useEnhancedMeetingManagement();

  return {
    meetingRequests: enhanced.meetings,
    loading: enhanced.isLoading,
    fetchMeetingRequests: enhanced.refetchMeetings,
    createMeetingRequest: enhanced.createMeeting,
    updateMeeting: enhanced.updateMeeting,
    cancelMeeting: enhanced.cancelMeeting,
    respondToMeeting: enhanced.respondToMeeting,
    syncMeetingToGoogle: enhanced.syncMeetingToGoogle,
    manualSyncMeeting: enhanced.syncMeetingToGoogle
  };
};