// This file has been migrated to the new centralized meetings system
// All functionality is now handled by useEnhancedMeetingManagement
// This export provides backward compatibility

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