
import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import ChatMessageInput from './ChatMessageInput';
import ChatRoomHeader from './ChatRoomHeader';
import ChatTypingIndicator from './ChatTypingIndicator';
import ChatMessagesContainer from './ChatMessagesContainer';
import ChatRoomAccessDenied from './ChatRoomAccessDenied';
import { useChatRoom } from '@/hooks/use-chat-room';
import { useChatParticipantCheck } from '@/hooks/use-chat-participant-check';
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
  const { isParticipant, isLoading: checkingAccess } = useChatParticipantCheck(room.id);
  
  const {
    user,
    messagesEndRef,
    scrollAreaRef,
    messages,
    newMessage,
    setNewMessage,
    fileUploads,
    setFileUploads,
    replyTo,
    setReplyTo,
    isSending,
    typingUsers,
    isLoading,
    hasMoreMessages,
    loadMoreMessages,
    leaving,
    isCreator,
    handleScroll,
    handleSendMessage,
    handleLeaveChat,
    handleDeleteRoom,
    handleReplyClick
  } = useChatRoom(room, onBack, onRoomDeleted);

  // Mark user interaction when they enter the chat room
  useEffect(() => {
    markUserInteraction();
  }, []);

  // Mark user interaction on any click in the chat area
  const handleChatClick = () => {
    markUserInteraction();
  };

  // Show loading state while checking access
  if (checkingAccess) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Checking room access...</div>
      </div>
    );
  }

  // Show access denied if user is not a participant
  if (!isParticipant) {
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
          scrollAreaRef={scrollAreaRef}
          messages={messages}
          userId={user?.id}
          isLoading={isLoading}
          hasMoreMessages={hasMoreMessages}
          loadMoreMessages={loadMoreMessages}
          onScroll={handleScroll}
          onReplyClick={handleReplyClick}
          messagesEndRef={messagesEndRef}
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
