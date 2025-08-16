import React from 'react';
import { useRooms } from '@/hooks/useRooms';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Hash, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompactRoomListProps {
  selectedRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
}

const CompactRoomList: React.FC<CompactRoomListProps> = ({
  selectedRoomId,
  onRoomSelect
}) => {
  const { rooms, loading } = useRooms();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-muted-foreground">Loading rooms...</div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center p-4">
        <Users className="h-8 w-8 text-muted-foreground mb-2" />
        <div className="text-sm text-muted-foreground">No chat rooms available</div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-40">
      <div className="space-y-1 p-2">
        {rooms.map((room) => (
          <Button
            key={room.id}
            variant={selectedRoomId === room.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start text-left h-auto p-2",
              selectedRoomId === room.id && "bg-accent"
            )}
            onClick={() => onRoomSelect(room.id)}
          >
            <Hash className="h-4 w-4 mr-2 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{room.name}</div>
              {room.description && (
                <div className="text-xs text-muted-foreground truncate">
                  {room.description}
                </div>
              )}
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default CompactRoomList;