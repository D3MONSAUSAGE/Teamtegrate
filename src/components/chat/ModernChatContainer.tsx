
import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import ModernRoomList from './ModernRoomList';
import ModernMessageArea from './ModernMessageArea';
import RoomMembersPanel from './RoomMembersPanel';
import UserSearchDialog from './UserSearchDialog';
import RoomSettingsDialog from './RoomSettingsDialog';
import { ChatErrorBoundary } from './ChatErrorBoundary';
import { useRooms } from '@/hooks/useRooms';
import { usePermissions } from '@/hooks/usePermissions';
import { useUserPresence } from '@/hooks/useUserPresence';
import { useChatRoomPermissions } from './hooks/useChatRoomPermissions';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ChatRoom } from '@/types/chat';

const ModernChatContainer: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(!isMobile);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  
  const { rooms } = useRooms();
  const { canManageRoom } = usePermissions(selectedRoomId);
  const { canCreateChatRoom, canInviteToChat } = useChatRoomPermissions();
  
  // Initialize presence tracking
  const { startTracking, stopTracking, isTracking } = useUserPresence(selectedRoomId || undefined);

  // Start presence tracking when user is available
  useEffect(() => {
    if (user && !isTracking) {
      startTracking();
    }

    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [user, startTracking, stopTracking, isTracking]);

  // Get selected room details
  const { data: selectedRoom } = useQuery({
    queryKey: ['room-details', selectedRoomId],
    queryFn: async () => {
      if (!selectedRoomId) return null;
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', selectedRoomId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedRoomId,
  });

  const handleRoomSelect = (room: ChatRoom) => {
    setSelectedRoomId(room.id);
  };

  const handleRoomDeleted = () => {
    setSelectedRoomId(null);
  };

  if (isMobile) {
    return (
      <ChatErrorBoundary>
        <div className="h-full flex flex-col bg-background">
          {!selectedRoomId ? (
            <ModernRoomList
              selectedRoom={selectedRoom}
              onRoomSelect={handleRoomSelect}
            />
          ) : selectedRoom ? (
            <ModernMessageArea
              room={selectedRoom}
              onBack={() => setSelectedRoomId(null)}
              onToggleMembers={() => setShowMembers(!showMembers)}
              onShowSettings={() => setShowRoomSettings(true)}
              onAddMember={() => setShowAddMember(true)}
              onRoomDeleted={handleRoomDeleted}
            />
          ) : null}
          
          {selectedRoom && (
            <>
              <UserSearchDialog
                open={showAddMember}
                onOpenChange={setShowAddMember}
                roomId={selectedRoomId!}
                onUsersAdded={() => {}}
              />
              
              <RoomSettingsDialog
                open={showRoomSettings}
                onOpenChange={setShowRoomSettings}
                room={selectedRoom}
              />
            </>
          )}
        </div>
      </ChatErrorBoundary>
    );
  }

  return (
    <ChatErrorBoundary>
      <div className="h-full bg-background">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Room List */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <div className="h-full p-4">
              <ModernRoomList
                selectedRoom={selectedRoom}
                onRoomSelect={handleRoomSelect}
              />
            </div>
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* Message Area */}
          <ResizablePanel defaultSize={showMembers ? 50 : 75}>
            <div className="h-full p-4 pr-2">
              {selectedRoomId && selectedRoom ? (
                <ModernMessageArea
                  room={selectedRoom}
                  onToggleMembers={() => setShowMembers(!showMembers)}
                  onShowSettings={() => setShowRoomSettings(true)}
                  onAddMember={() => setShowAddMember(true)}
                  onRoomDeleted={handleRoomDeleted}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center p-8 rounded-xl bg-card border border-border/50">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Select a chat room
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a room from the sidebar to start chatting
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>
          
          {/* Members Panel */}
          {showMembers && selectedRoomId && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
                <div className="h-full p-4 pl-2">
                  <div className="h-full rounded-xl bg-card border border-border/50">
                    <RoomMembersPanel
                      roomId={selectedRoomId}
                      canManage={canManageRoom}
                      onAddMember={() => setShowAddMember(true)}
                    />
                  </div>
                </div>
              </ResizablePanel>
            </>
          )}
          
          {/* Dialogs */}
          {selectedRoom && (
            <>
              <UserSearchDialog
                open={showAddMember}
                onOpenChange={setShowAddMember}
                roomId={selectedRoomId!}
                onUsersAdded={() => {}}
              />
              
              <RoomSettingsDialog
                open={showRoomSettings}
                onOpenChange={setShowRoomSettings}
                room={selectedRoom}
              />
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </ChatErrorBoundary>
  );
};

export default ModernChatContainer;
