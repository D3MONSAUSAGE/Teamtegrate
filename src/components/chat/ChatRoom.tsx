
import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import ChatMessageInput from './ChatMessageInput';
import ChatRoomHeader from './ChatRoomHeader';
import ChatTypingIndicator from './ChatTypingIndicator';
import ChatMessagesContainer from './ChatMessagesContainer';
import ChatRoomAccessDenied from './ChatRoomAccessDenied';
import { useChatRoom } from '@/hooks/use-chat-room';
import { useChatParticipantCheck } from '@/hooks/use-chat-participant-check';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/use-chat';
import { markUserInteraction } from '@/utils/chatSounds';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatRoomProps {
  room: {
    id: string;
    name: string;
    created_by: string;
  };
  onBack?: () => void;
  onRoomDeleted?: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ room, onBack, onRoomDeleted }) => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { isParticipant, isLoading: checkingAccess } = useChatParticipantCheck(room.id);
  
  const {
    room: roomData,
    participants,
    loading: roomLoading,
    hasAccess,
    addParticipant,
    removeParticipant,
    refetch
  } = useChatRoom(room.id);

  const {
    messages,
    isLoading: messagesLoading,
    newMessage,
    setNewMessage,
    fileUploads,
    setFileUploads,
    sendMessage,
    replyTo,
    setReplyTo,
    typingUsers,
    isSending,
    hasMoreMessages,
    loadMoreMessages
  } = useChat(room.id, user?.id);

  // Mark user interaction when they enter the chat room
  useEffect(() => {
    markUserInteraction();
  }, []);

  // Mark user interaction on any click in the chat area
  const handleChatClick = () => {
    markUserInteraction();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage();
  };

  const handleLeaveChat = async () => {
    // Implementation for leaving chat
    if (user && room.created_by !== user.id) {
      await removeParticipant(user.id);
      onBack?.();
    }
  };

  const handleDeleteRoom = async () => {
    // Implementation for deleting room
    onRoomDeleted?.();
  };

  const handleReplyClick = (message: any) => {
    setReplyTo(message);
  };

  const isCreator = user?.id === room.created_by;
  const leaving = false; // Implement leaving state if needed

  // Show loading state while checking access
  if (checkingAccess || roomLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Checking room access...</div>
      </div>
    );
  }

  // Show access denied if user is not a participant
  if (!isParticipant || !hasAccess) {
    return <ChatRoomAccessDenied roomName={room.name} onBack={onBack} />;
  }

  return (
    <div 
      className="flex flex-col h-full bg-background overflow-hidden"
      onClick={handleChatClick}
    >
      <ChatRoomHeader
        room={room}
        isMobile={isMobile}
        currentUserId={user?.id}
        onBack={onBack}
        toggleParticipants={() => {}} // Remove drawer functionality
        onLeave={handleLeaveChat}
        onDelete={handleDeleteRoom}
        leaving={leaving}
        canDelete={isCreator}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatMessagesContainer
          scrollAreaRef={React.createRef()}
          messages={messages}
          userId={user?.id}
          isLoading={messagesLoading}
          hasMoreMessages={hasMoreMessages}
          loadMoreMessages={loadMoreMessages}
          onScroll={() => {}}
          onReplyClick={handleReplyClick}
          messagesEndRef={React.createRef()}
        />

        <ChatTypingIndicator typingUsers={typingUsers} />

        <ChatMessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          fileUploads={fileUploads}
          setFileUploads={setFileUploads}
          onSubmit={handleSendMessage}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
          isSending={isSending}
          roomId={room.id}
        />
      </div>
    </div>
  );
};

export default ChatRoom;
