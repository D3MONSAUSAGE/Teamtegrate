
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import CreateRoomDialog from './CreateRoomDialog';
import { Button } from '@/components/ui/button';
import { Plus, Search, MessagesSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ChatRoomData {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  last_message_at?: string;
  unread_count?: number;
}

interface ChatRoomsProps {
  selectedRoom: ChatRoomData | null;
  onRoomSelect: (room: ChatRoomData) => void;
}

const ChatRooms: React.FC<ChatRoomsProps> = ({ selectedRoom, onRoomSelect }) => {
  const [rooms, setRooms] = useState<ChatRoomData[]>([]);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  
  useEffect(() => {
    fetchRooms();
    const channel = subscribeToRooms();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching rooms:', error);
        toast.error('Failed to load chat rooms');
        return;
      }

      // Add dummy unread counts for demo purposes - in a real app, you would fetch this from the database
      const roomsWithMeta = data.map(room => ({
        ...room,
        unread_count: Math.floor(Math.random() * 5)
      }));

      setRooms(roomsWithMeta);
    } catch (error) {
      console.error('Unexpected error fetching rooms:', error);
      toast.error('Failed to load chat rooms');
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

    return channel;
  };

  const handleRoomSelect = (room: ChatRoomData) => {
    // Clear the unread count for the selected room
    setRooms(prevRooms => 
      prevRooms.map(r => 
        r.id === room.id 
          ? { ...r, unread_count: 0 }
          : r
      )
    );
    
    // Call the parent's onRoomSelect with the updated room
    onRoomSelect({ ...room, unread_count: 0 });
  };

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="h-full flex flex-col border-0 rounded-none">
      <div className="p-4 border-b border-border dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <MessagesSquare className="h-5 w-5 text-primary" />
            Team Chat
          </h2>
          <Button
            size="sm"
            onClick={() => setIsCreateRoomOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search rooms..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-1">
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <Button
                key={room.id}
                variant={selectedRoom?.id === room.id ? "default" : "ghost"}
                className="w-full justify-start font-normal relative"
                onClick={() => handleRoomSelect(room)}
              >
                <div className="truncate flex-1 text-left">{room.name}</div>
                {room.unread_count > 0 && selectedRoom?.id !== room.id && (
                  <Badge className="ml-2 bg-primary hover:bg-primary">{room.unread_count}</Badge>
                )}
              </Button>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No matching rooms found' : 'No chat rooms available'}
            </div>
          )}
        </div>
      </ScrollArea>

      <CreateRoomDialog
        open={isCreateRoomOpen}
        onOpenChange={setIsCreateRoomOpen}
      />
    </Card>
  );
};

export default ChatRooms;
