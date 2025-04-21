import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Users, UserPlus } from "lucide-react";
import ChatMessageAvatar from './ChatMessageAvatar';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AddChatParticipantDialog from './AddChatParticipantDialog';

interface ChatParticipantsProps {
  roomId: string;
  compact?: boolean;
}

const ChatParticipants: React.FC<ChatParticipantsProps> = ({ roomId, compact = false }) => {
  const { user: currentUser } = useAuth();
  
  const [openAdd, setOpenAdd] = React.useState(false);

  const { data: participants, isLoading } = useQuery({
    queryKey: ['chat-participants', roomId],
    queryFn: async () => {
      // First get unique user IDs who have sent messages in this room
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('user_id')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });
      
      if (messagesError) throw messagesError;
      
      if (!messages || messages.length === 0) return [];

      // Extract unique user IDs
      const uniqueUserIds = [...new Set(messages.map(msg => msg.user_id))];
      
      // Fetch user details for these IDs
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, avatar_url')
        .in('id', uniqueUserIds);
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
        // Return fallback user data using the authenticated user if available
        return uniqueUserIds.map(id => {
          // If this is the current user, use our auth context data
          if (currentUser && id === currentUser.id) {
            return {
              id: currentUser.id,
              name: currentUser.name,
              avatar_url: null
            };
          }
          // Otherwise return a placeholder
          return {
            id: id,
            name: 'User',
            avatar_url: null
          };
        });
      }
      
      // Combine database results with current user data for completeness
      const participantsList = [...(users || [])];
      
      // If current user is a participant but not in the database results, add them
      if (currentUser && uniqueUserIds.includes(currentUser.id) && 
          !participantsList.some(p => p.id === currentUser.id)) {
        participantsList.push({
          id: currentUser.id,
          name: currentUser.name,
          avatar_url: null
        });
      }
      
      return participantsList;
    },
  });

  // If compact mode is enabled, just show the count
  if (compact) {
    return (
      <span>
        {participants?.length || 0} participants
      </span>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Users className="h-5 w-5" />
          {participants && participants.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {participants.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4 border-b flex items-center justify-between">
          <h4 className="font-medium">Participants ({participants?.length || 0})</h4>
          <Button variant="outline" size="sm" onClick={() => setOpenAdd(true)}>
            <UserPlus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        <ScrollArea className="h-[300px] p-4">
          {isLoading ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Loading participants...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {participants?.length ? (
                participants.map((user) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <ChatMessageAvatar userId={user.id} className="h-8 w-8" />
                    <span className="text-sm">
                      {user.name || 'Unknown User'}
                      {currentUser?.id === user.id && " (You)"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No participants yet
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        <AddChatParticipantDialog
          open={openAdd}
          onOpenChange={setOpenAdd}
          roomId={roomId}
          onAdded={() => { /* could trigger refetch if needed */ }}
        />
      </PopoverContent>
    </Popover>
  );
};

export default ChatParticipants;
