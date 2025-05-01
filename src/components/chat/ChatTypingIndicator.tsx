
import React from 'react';

interface ChatTypingIndicatorProps {
  typingUsers: string[];
}

const ChatTypingIndicator: React.FC<ChatTypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;
  
  let typingText = '';
  if (typingUsers.length === 1) {
    typingText = `${typingUsers[0]} is typing...`;
  } else if (typingUsers.length === 2) {
    typingText = `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
  } else {
    typingText = `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;
  }
  
  return (
    <div className="px-4 py-1 text-xs text-muted-foreground italic">
      {typingText}
      <span className="typing-animation">
        <span className="dot">.</span>
        <span className="dot">.</span>
        <span className="dot">.</span>
      </span>
      <style jsx>
        {`
          .typing-animation .dot {
            animation: typing 1.5s infinite;
            display: inline-block;
            opacity: 0;
          }
          
          .typing-animation .dot:nth-child(1) {
            animation-delay: 0s;
          }
          
          .typing-animation .dot:nth-child(2) {
            animation-delay: 0.5s;
          }
          
          .typing-animation .dot:nth-child(3) {
            animation-delay: 1s;
          }
          
          @keyframes typing {
            0% { opacity: 0; }
            50% { opacity: 1; }
            100% { opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};

export default ChatTypingIndicator;
