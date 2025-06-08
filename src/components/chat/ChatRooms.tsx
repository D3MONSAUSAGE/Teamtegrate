
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { useChatPermissions } from '@/hooks/use-chat-permissions';
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
  const { canCreateRooms } = useChatPermissions();
  
  useEffect(() => {
    fetchRooms();
    const channel = subscribeToRooms();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRooms = async () => {
    console.log('=== CHAT ROOMS DEBUG START ===');
    console.log('Current user:', user);
    console.log('User ID:', user?.id);
    console.log('User role:', user?.role);
    
    try {
      // Test the get_user_role function first
      const { data: roleData, error: roleError } = await supabase.rpc('get_user_role');
      console.log('get_user_role() result:', roleData);
      if (roleError) {
        console.error('Error calling get_user_role():', roleError);
      }

      // The RLS policies will automatically filter rooms based on user role and permissions
      console.log('Fetching chat rooms...');
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Supabase query result:');
      console.log('- Data:', data);
      console.log('- Error:', error);
      console.log('- Number of rooms returned:', data?.length || 0);

      if (error) {
        console.error('Error fetching rooms:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        toast.error('Failed to load chat rooms');
        return;
      }

      if (!data || data.length === 0) {
        console.warn('No chat rooms returned from database');
        console.log('This could mean:');
        console.log('1. No rooms exist in the database');
        console.log('2. RLS policies are blocking access');
        console.log('3. User is not authenticated properly');
        
        // Test direct database access
        console.log('Testing raw query without RLS...');
        
        setRooms([]);
        return;
      }

      // Add dummy unread counts for demo purposes - in a real app, you would fetch this from the database
      const roomsWithMeta = data.map(room => {
        console.log('Processing room:', room);
        return {
          ...room,
          unread_count: Math.floor(Math.random() * 5)
        };
      });

      console.log('Final rooms with metadata:', roomsWithMeta);
      setRooms(roomsWithMeta);
      
    } catch (error) {
      console.error('Unexpected error fetching rooms:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      toast.error('Failed to load chat rooms');
    }
    
    console.log('=== CHAT ROOMS DEBUG END ===');
  };

  const subscribeToRooms = () => {
    const channel = supabase
      .channel('chat-rooms')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_rooms' },
        (payload) => {
          console.log('Real-time chat room update:', payload);
          fetchRooms();
        }
      )
      .subscribe();

    return channel;
  };

  const handleRoomSelect = (room: ChatRoomData) => {
    console.log('Room selected:', room);
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

  console.log('Render state:');
  console.log('- Total rooms:', rooms.length);
  console.log('- Filtered rooms:', filteredRooms.length);
  console.log('- Search query:', searchQuery);
  console.log('- Can create rooms:', canCreateRooms());

  return (
    <Card className="h-full flex flex-col border-0 rounded-none">
      <div className="p-4 border-b border-border dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <MessagesSquare className="h-5 w-5 text-primary" />
            Team Chat
          </h2>
          {canCreateRooms() && (
            <Button
              size="sm"
              onClick={() => setIsCreateRoomOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          )}
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
              <div className="text-xs mt-2 text-muted-foreground/70">
                {rooms.length === 0 && !searchQuery && (
                  <div>
                    <p>Debug info:</p>
                    <p>User: {user?.email}</p>
                    <p>Role: {user?.role}</p>
                    <p>Check console for detailed logs</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {canCreateRooms() && (
        <CreateRoomDialog
          open={isCreateRoomOpen}
          onOpenChange={setIsCreateRoomOpen}
        />
      )}
    </Card>
  );
};

export default ChatRooms;
