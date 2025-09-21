import { MeetingRequestWithParticipants } from '@/types/meeting';

export interface MeetingContextType {
  meetings: MeetingRequestWithParticipants[];
  loading: boolean;
  error: string | null;
  
  // CRUD operations
  fetchMeetings: () => Promise<void>;
  refreshMeetings: () => Promise<void>;
  createMeeting: (
    title: string,
    description: string, 
    startTime: Date,
    endTime: Date,
    participantIds: string[],
    location?: string
  ) => Promise<any>;
  updateMeeting: (
    meetingId: string,
    title: string,
    description: string,
    startTime: Date,
    endTime: Date,
    participantIds: string[],
    location?: string
  ) => Promise<boolean>;
  cancelMeeting: (meetingId: string) => Promise<boolean | null>;
  respondToMeeting: (participantId: string, response: 'accepted' | 'declined' | 'tentative') => Promise<void>;
  
  // Google Calendar sync
  syncMeetingToGoogle: (meetingId: string, action?: 'create' | 'update' | 'delete') => Promise<boolean>;
}

export { MeetingProvider, useMeeting } from './MeetingContext';