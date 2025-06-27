
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Loader2, Users, Settings, UserPlus, Smile } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useMessages } from '@/hooks/useMessages';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { ChatRoom } from '@/types/chat';
import EnhancedMessageBubble from './EnhancedMessageBubble';
import { playChatNotification } from '@/utils/chatSounds';
import { useSoundSettings } from '@/hooks/useSoundSettings';

interface ModernMessageAreaProps {
  room: ChatRoom;
  onBack?: () => void;
  onToggleMembers?: () => void;
  onShowSettings?: () => void;
  onAddMember?: () => void;
}

const ModernMessageArea: React.FC<ModernMessageAreaProps> = ({ 
  room, 
  onBack,
  onToggleMembers,
  onShowSettings,
  onAddMember
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const soundSettings = useSoundSettings();
  
  const { messages, loading, sendMessage } = useMessages(room.id);
  const { isParticipant, canManageRoom } = usePermissions(room.id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Play sound for new messages (not from current user)
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.user_id !== user?.id) {
      playChatNotification(soundSettings);
    }
  }, [messages, user?.id, soundSettings]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Simple typing indicator logic
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
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
    <Card className="h-full border-0 rounded-3xl bg-gradient-to-br from-card/50 via-card/80 to-card/50 backdrop-blur-sm shadow-lg flex flex-col">
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-primary/10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">
                  {room.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-lg">{room.name}</h2>
                <div className="flex items-center gap-2">
                  {room.description && (
                    <p className="text-sm text-muted-foreground">{room.description}</p>
                  )}
                  <Badge 
                    variant={room.is_public ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {room.is_public ? "Public" : "Private"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onToggleMembers && (
              <Button variant="ghost" size="icon" onClick={onToggleMembers} className="hover:bg-primary/10">
                <Users className="h-4 w-4" />
              </Button>
            )}
            
            {canManageRoom && onAddMember && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onAddMember}
                className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 hover:from-green-500/20 hover:to-emerald-500/20"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Add
              </Button>
            )}
            
            {canManageRoom && onShowSettings && (
              <Button variant="ghost" size="icon" onClick={onShowSettings} className="hover:bg-primary/10">
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col">
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-1">
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
              messages.map((message, index) => {
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
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Typing indicator */}
        {isTyping && (
          <div className="px-6 py-2 text-sm text-muted-foreground">
            Someone is typing...
          </div>
        )}

        <div className="p-6 border-t border-border/50 bg-card/30">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <div className="relative flex-1">
              <Textarea
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="min-h-[44px] max-h-[120px] resize-none bg-background/80 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-200 pr-12"
                disabled={sending}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8 hover:bg-primary/10"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              type="submit" 
              size="icon"
              disabled={!newMessage.trim() || sending}
              className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 h-11 w-11"
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

export default ModernMessageArea;
