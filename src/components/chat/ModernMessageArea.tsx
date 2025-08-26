
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Loader2, Users, Settings, UserPlus, Smile, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useMessages } from '@/hooks/useMessages';
import { usePermissions } from '@/hooks/usePermissions';
import { useChatPermissions } from '@/hooks/use-chat-permissions';
import { useRooms } from '@/hooks/useRooms';
import { useAuth } from '@/contexts/AuthContext';
import { useMessagePerformance } from '@/hooks/useMessagePerformance';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useInputTyping } from '@/hooks/useInputTyping';
import { ChatRoom } from '@/types/chat';
import EnhancedMessageBubble from './EnhancedMessageBubble';
import DeleteChatRoomDialog from './DeleteChatRoomDialog';
import { MessagePagination } from './MessagePagination';
import { TypingIndicator } from './TypingIndicator';

interface ModernMessageAreaProps {
  room: ChatRoom;
  onBack?: () => void;
  onToggleMembers?: () => void;
  onShowSettings?: () => void;
  onAddMember?: () => void;
  onRoomDeleted?: () => void;
}

const ModernMessageArea: React.FC<ModernMessageAreaProps> = ({ 
  room, 
  onBack,
  onToggleMembers,
  onShowSettings,
  onAddMember,
  onRoomDeleted
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const { messages, loading, loadingMore, hasMore, sendMessage, loadMoreMessages } = useMessages(room.id);
  const { isParticipant, canManageRoom } = usePermissions(room.id);
  const { canDeleteRoom } = useChatPermissions();
  const { deleteRoom } = useRooms();

  // Performance monitoring
  useMessagePerformance(room.id, messages.length, loading);

  // Typing indicators
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator({
    roomId: room.id,
    enabled: isParticipant
  });

  // Input typing handlers
  const { handleInputChange, handleInputFocus, handleInputBlur, handleKeyDown } = useInputTyping({
    onStartTyping: startTyping,
    onStopTyping: stopTyping,
    debounceMs: 500
  });

  const showDeleteButton = user && room && canDeleteRoom(room.created_by);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Smart scrolling - only scroll to bottom for new messages, not when loading more
  useEffect(() => {
    if (!loadingMore) {
      scrollToBottom();
    }
  }, [messages.length, loadingMore]);

  // Sound notifications are handled by useRealtimeNotifications hook

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      // Stop typing when sending
      stopTyping();
      await sendMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleMessageInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Handle typing detection
    if (value.trim()) {
      handleInputChange(value);
    } else {
      stopTyping();
    }
  };

  const handleMessageKeyDown = (e: React.KeyboardEvent) => {
    // Handle typing detection
    handleKeyDown(e);
    
    // Send message on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleDeleteRoom = async () => {
    try {
      setIsDeleting(true);
      await deleteRoom(room.id);
      setShowDeleteDialog(false);
      onRoomDeleted?.();
    } catch (error) {
      console.error('Failed to delete room:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isParticipant) {
    return (
      <Card className="h-full border-0 rounded-3xl bg-gradient-to-br from-card/50 via-card/80 to-card/50 backdrop-blur-sm shadow-lg">
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
              <Users className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access this chat room.
            </p>
            {onBack && (
              <Button onClick={onBack} className="bg-gradient-to-r from-primary to-purple-500 text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Rooms
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-card border border-border/50 rounded-xl shadow-sm flex flex-col">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-primary/10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {room.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-base">{room.name}</h2>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={room.is_public ? "default" : "secondary"}
                    className="text-xs h-5"
                  >
                    {room.is_public ? "Public" : "Private"}
                  </Badge>
                  {room.description && (
                    <span className="text-xs text-muted-foreground">• {room.description}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {onToggleMembers && (
              <Button variant="ghost" size="sm" onClick={onToggleMembers}>
                <Users className="h-4 w-4" />
              </Button>
            )}
            
            {canManageRoom && onAddMember && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onAddMember}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            )}
            
            {canManageRoom && onShowSettings && (
              <Button variant="ghost" size="sm" onClick={onShowSettings}>
                <Settings className="h-4 w-4" />
              </Button>
            )}

            {showDeleteButton && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col">
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                <Send className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Start the conversation!</h3>
              <p className="text-muted-foreground">
                Be the first to send a message in this room.
              </p>
            </div>
          ) : (
            <>
              <MessagePagination
                hasMore={hasMore}
                loadingMore={loadingMore}
                onLoadMore={loadMoreMessages}
                messagesCount={messages.length}
              />
              <div className="p-6 space-y-1">
                {messages.map((message, index) => {
                  try {
                    if (!message?.id || !message?.content) return null;
                    
                    const prevMessage = messages[index - 1];
                    const showAvatar = !prevMessage || prevMessage.user_id !== message.user_id;
                    
                    return (
                      <EnhancedMessageBubble
                        key={message.id}
                        message={message}
                        isCurrentUser={message.user_id === user?.id}
                        showAvatar={showAvatar}
                        userName={message.user_id === user?.id ? 'You' : 'User'}
                      />
                    );
                  } catch (error) {
                    console.error('[MESSAGE_RENDER_ERROR]', error);
                    return null;
                  }
                }).filter(Boolean)}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </ScrollArea>

        {/* Typing indicator */}
        <TypingIndicator typingUsers={typingUsers} />

        <div className="p-4 border-t border-border/50 bg-muted/30">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="relative flex-1">
              <Textarea
                value={newMessage}
                onChange={handleMessageInputChange}
                onKeyDown={handleMessageKeyDown}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Type your message..."
                className="min-h-[40px] max-h-[120px] resize-none pr-10"
                disabled={sending}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-7 w-7"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              type="submit" 
              size="icon"
              disabled={!newMessage.trim() || sending}
              className="h-10 w-10"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>

      <DeleteChatRoomDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteRoom}
        isDeleting={isDeleting}
      />
    </Card>
  );
};

export default ModernMessageArea;
