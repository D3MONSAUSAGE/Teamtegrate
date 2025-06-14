
export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  organization_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'file' | 'image' | 'system';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ChatParticipant {
  id: string;
  room_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
}

export interface ChatAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}
