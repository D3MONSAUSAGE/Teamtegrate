
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Users, MessageSquare, Hash } from 'lucide-react';
import { useRooms } from '@/hooks/useRooms';
import { useAuth } from '@/contexts/AuthContext';
import { ChatRoom } from '@/types/chat';
import { cn } from '@/lib/utils';
import CreateRoomDialog from './CreateRoomDialog';

interface ModernRoomListProps {
  selectedRoom: ChatRoom | null;
  onRoomSelect: (room: ChatRoom) => void;
}

const ModernRoomList: React.FC<ModernRoomListProps> = ({
  selectedRoom,
  onRoomSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { rooms, loading } = useRooms();
  const { user } = useAuth();

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="h-full border-0 rounded-3xl bg-gradient-to-br from-card/50 via-card/80 to-card/50 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Chat Rooms
          </CardTitle>
          <Button
            onClick={() => setShowCreateDialog(true)}
            size="sm"
            className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-200"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-2 p-6 pt-0">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No rooms found' : 'No chat rooms yet'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    variant="outline"
                    className="mt-4"
                  >
                    Create your first room
                  </Button>
                )}
              </div>
            ) : (
              filteredRooms.map((room, index) => (
                <div
                  key={room.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:shadow-md animate-fade-in group",
                    selectedRoom?.id === room.id
                      ? "bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30 shadow-md"
                      : "bg-card/80 hover:bg-card border-border/50 hover:border-primary/30"
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => onRoomSelect(room)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors duration-200",
                      selectedRoom?.id === room.id
                        ? "bg-primary/20 text-primary"
                        : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    )}>
                      {room.is_public ? <Hash className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm truncate">
                          {room.name}
                        </h3>
                        <Badge
                          variant={room.is_public ? "default" : "secondary"}
                          className="text-xs px-2 py-0.5"
                        >
                          {room.is_public ? "Public" : "Private"}
                        </Badge>
                      </div>
                      
                      {room.description && (
                        <p className="text-xs text-muted-foreground truncate mb-2">
                          {room.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {new Date(room.updated_at).toLocaleDateString()}
                        </span>
                        {/* Placeholder for unread count - would need additional data */}
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span>Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CreateRoomDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </Card>
  );
};

export default ModernRoomList;
