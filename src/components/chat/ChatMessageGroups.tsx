
import React from 'react';
import ChatMessage from './ChatMessage';

interface Message {
  id: string;
  created_at?: string;
  user_id: string;
  parent_id?: string;
  [key: string]: any;
}
interface ChatMessageGroupsProps {
  groupedMessages: [string, Message[]][];
  msgMap: Record<string, any>;
  userId?: string;
  onReplyClick: (msg: any) => void;
}

const ChatMessageGroups: React.FC<ChatMessageGroupsProps> = ({
  groupedMessages,
  msgMap,
  userId,
  onReplyClick,
}) => {
  const getTodayLabel = (date: string) => (
    date === new Date().toDateString() ? 'Today' : date
  );

  return (
    <div className="space-y-4 px-1">
      {groupedMessages.map(([date, dateMessages]) => (
        <div key={date}>
          <div className="flex justify-center my-2">
            <div className="px-3 py-1 bg-accent/30 dark:bg-accent/10 rounded-full text-xs text-muted-foreground">
              {getTodayLabel(date)}
            </div>
          </div>
          <div className="space-y-1">
            {dateMessages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isCurrentUser={message.user_id === userId}
                onReplyClick={onReplyClick}
                parentMessage={message.parent_id ? msgMap[message.parent_id] : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatMessageGroups;
