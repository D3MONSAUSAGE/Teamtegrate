
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, MessageCircle, Loader2 } from 'lucide-react';
import { useRooms } from '@/hooks/useRooms';
import { ChatRoom } from '@/types/chat';
import CreateRoomDialog from './CreateRoomDialog';

interface RoomListProps {
  selectedRoom: ChatRoom | null;
  onRoomSelect: (room: ChatRoom) => void;
}

const RoomList: React.FC<RoomListProps> = ({ selectedRoom, onRoomSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { rooms, loading, createRoom } = useRooms();

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="h-full border-0 rounded-none">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full border-0 rounded-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat Rooms
          </h2>
          <Button 
            size="sm" 
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            New
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
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-1 p-3">
            {filteredRooms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No rooms found' : 'No chat rooms yet'}
              </div>
            ) : (
              filteredRooms.map((room) => (
                <Button
                  key={room.id}
                  variant={selectedRoom?.id === room.id ? "default" : "ghost"}
                  className="w-full justify-start font-normal"
                  onClick={() => onRoomSelect(room)}
                >
                  <div className="truncate">{room.name}</div>
                </Button>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CreateRoomDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateRoom={createRoom}
      />
    </Card>
  );
};

export default RoomList;
