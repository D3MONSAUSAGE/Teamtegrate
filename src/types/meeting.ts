export interface MeetingRequest {
  id: string;
  organizer_id: string;
  organization_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface MeetingParticipant {
  id: string;
  meeting_request_id: string;
  user_id: string;
  response_status: 'invited' | 'accepted' | 'declined' | 'tentative';
  responded_at?: string;
  created_at: string;
  // Enriched user fields (optional)
  user_name?: string;
  user_email?: string;
  user_avatar_url?: string;
}

export interface MeetingRequestWithParticipants extends MeetingRequest {
  participants: MeetingParticipant[];
  organizer_name?: string;
}