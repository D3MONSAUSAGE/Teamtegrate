
import React from 'react';
import { Card } from '@/components/ui/card';
import ChatMessageInput from './ChatMessageInput';
import ChatRoomHeader from './ChatRoomHeader';
import ChatTypingIndicator from './ChatTypingIndicator';
import ChatMessagesContainer from './ChatMessagesContainer';
import { useChatRoom } from '@/hooks/use-chat-room';

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
  const {
    user,
    messagesEndRef,
    scrollAreaRef,
    isMobile,
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

  return (
    <Card className="flex flex-col h-full border-border dark:border-gray-800 shadow-none bg-background dark:bg-[#111827] overflow-hidden">
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
    </Card>
  );
};

export default ChatRoom;
