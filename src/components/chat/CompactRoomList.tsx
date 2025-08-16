import React, { useState, useEffect } from 'react';
import { useRooms } from '@/hooks/useRooms';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Hash, Users, Clock, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface CompactRoomListProps {
  selectedRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
}

const CompactRoomList: React.FC<CompactRoomListProps> = ({
  selectedRoomId,
  onRoomSelect
}) => {
  const { rooms, loading } = useRooms();
  const { user } = useAuth();
  const [roomsWithDetails, setRoomsWithDetails] = useState<any[]>([]);

  // Fetch room details (last message, participant count, unread count)
  const fetchRoomDetails = async () => {
    if (!rooms.length || !user) return;

    const roomDetails = await Promise.all(
      rooms.map(async (room) => {
        try {
          // Get last message
          const { data: lastMessage } = await supabase
            .from('chat_messages')
            .select('content, created_at, user_id')
            .eq('room_id', room.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get participant count
          const { count: participantCount } = await supabase
            .from('chat_participants')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);

          // Get unread count (messages since user last seen - simplified to last hour)
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
          const { count: unreadCount } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .neq('user_id', user.id)
            .gte('created_at', oneHourAgo)
            .is('deleted_at', null);

          return {
            ...room,
            lastMessage,
            participantCount: participantCount || 0,
            unreadCount: unreadCount || 0
          };
        } catch (error) {
          console.error('Error fetching room details:', error);
          return {
            ...room,
            lastMessage: null,
            participantCount: 0,
            unreadCount: 0
          };
        }
      })
    );

    setRoomsWithDetails(roomDetails);
  };

  useEffect(() => {
    fetchRoomDetails();
  }, [rooms, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="text-sm text-muted-foreground">Loading rooms...</div>
      </div>
    );
  }

  if (roomsWithDetails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-24 text-center p-4">
        <Users className="h-6 w-6 text-muted-foreground mb-2" />
        <div className="text-xs text-muted-foreground">No chat rooms available</div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-32">
      <div className="space-y-1 p-2">
        {roomsWithDetails.map((room) => (
          <Button
            key={room.id}
            variant={selectedRoomId === room.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start text-left h-auto p-2 relative",
              selectedRoomId === room.id && "bg-accent border border-accent-foreground/20"
            )}
            onClick={() => onRoomSelect(room.id)}
          >
            <div className="flex items-start gap-2 w-full min-w-0">
              <div className="flex-shrink-0 relative">
                <Hash className="h-4 w-4 text-muted-foreground" />
                {room.unreadCount > 0 && (
                  <Circle className="h-2 w-2 fill-primary text-primary absolute -top-1 -right-1" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div className="font-medium text-sm truncate">{room.name}</div>
                  {room.unreadCount > 0 && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                      {room.unreadCount > 99 ? '99+' : room.unreadCount}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <div className="text-xs text-muted-foreground truncate flex-1">
                    {room.lastMessage 
                      ? room.lastMessage.content
                      : room.description || "No messages yet"
                    }
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                    {room.participantCount > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Users className="h-3 w-3" />
                        {room.participantCount}
                      </div>
                    )}
                    {room.lastMessage && (
                      <div className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(room.lastMessage.created_at), { addSuffix: false })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default CompactRoomList;