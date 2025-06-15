
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Loader2, Users, Settings, UserPlus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useMessages } from '@/hooks/useMessages';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { ChatRoom } from '@/types/chat';
import MessageBubble from './MessageBubble';

interface EnhancedMessageAreaProps {
  room: ChatRoom;
  onBack?: () => void;
  onToggleMembers?: () => void;
  onShowSettings?: () => void;
  onAddMember?: () => void;
}

const EnhancedMessageArea: React.FC<EnhancedMessageAreaProps> = ({ 
  room, 
  onBack,
  onToggleMembers,
  onShowSettings,
  onAddMember
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const { messages, loading, sendMessage } = useMessages(room.id);
  const { isParticipant, canManageRoom } = usePermissions(room.id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      await sendMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!isParticipant) {
    return (
      <Card className="h-full border-0 rounded-none">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don't have permission to access this chat room.
            </p>
            {onBack && (
              <Button onClick={onBack} className="mt-4">
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
    <Card className="h-full border-0 rounded-none flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h2 className="font-semibold">{room.name}</h2>
              {room.description && (
                <p className="text-sm text-muted-foreground">{room.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onToggleMembers && (
              <Button variant="ghost" size="icon" onClick={onToggleMembers}>
                <Users className="h-4 w-4" />
              </Button>
            )}
            
            {canManageRoom && onAddMember && (
              <Button variant="outline" size="sm" onClick={onAddMember}>
                <UserPlus className="h-4 w-4 mr-1" />
                Add
              </Button>
            )}
            
            {canManageRoom && onShowSettings && (
              <Button variant="ghost" size="icon" onClick={onShowSettings}>
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col">
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {loading ? (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isCurrentUser={message.user_id === user?.id}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[40px] max-h-[120px] resize-none"
              disabled={sending}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!newMessage.trim() || sending}
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
    </Card>
  );
};

export default EnhancedMessageArea;
