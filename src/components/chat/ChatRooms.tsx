
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import ChatRoom from './ChatRoom';
import CreateRoomDialog from './CreateRoomDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ChatRoomData {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
}

const ChatRooms = () => {
  const [rooms, setRooms] = useState<ChatRoomData[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomData | null>(null);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchRooms();
    subscribeToRooms();
  }, []);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rooms:', error);
      return;
    }

    setRooms(data);
    if (data.length > 0 && !selectedRoom) {
      setSelectedRoom(data[0]);
    }
  };

  const subscribeToRooms = () => {
    const channel = supabase
      .channel('chat-rooms')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_rooms' },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return (
    <div className="flex h-full gap-4">
      <div className="w-64 bg-white border rounded-lg p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Chat Rooms</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCreateRoomOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex flex-col gap-2 overflow-y-auto">
          {rooms.map((room) => (
            <Button
              key={room.id}
              variant={selectedRoom?.id === room.id ? "default" : "ghost"}
              className="justify-start"
              onClick={() => setSelectedRoom(room)}
            >
              {room.name}
            </Button>
          ))}
        </div>
      </div>

      {selectedRoom && (
        <div className="flex-1 bg-white border rounded-lg">
          <ChatRoom room={selectedRoom} />
        </div>
      )}

      <CreateRoomDialog
        open={isCreateRoomOpen}
        onOpenChange={setIsCreateRoomOpen}
      />
    </div>
  );
};

export default ChatRooms;
