
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import ChatRoom from './ChatRoom';
import CreateRoomDialog from './CreateRoomDialog';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card } from '@/components/ui/card';

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
  const isMobile = useIsMobile();
  
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

  const handleBackToRooms = () => {
    setSelectedRoom(null);
  };

  if (isMobile && selectedRoom) {
    return (
      <div className="h-full">
        <ChatRoom room={selectedRoom} onBack={handleBackToRooms} />
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4">
      <Card className={`${
        isMobile || !selectedRoom ? 'w-full' : 'w-64'
      } bg-card dark:bg-[#1f2133] border-border dark:border-gray-800 flex flex-col`}>
        <div className="p-4 border-b border-border dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold">Chat Rooms</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCreateRoomOpen(true)}
            className="dark:border-gray-700 dark:bg-[#181928]/70 dark:hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {rooms.map((room) => (
            <Button
              key={room.id}
              variant={selectedRoom?.id === room.id ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedRoom(room)}
            >
              {room.name}
            </Button>
          ))}
        </div>
      </Card>

      {selectedRoom && !isMobile && (
        <div className="flex-1">
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
