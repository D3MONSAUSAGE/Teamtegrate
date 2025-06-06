
import React from 'react';

interface ChatDragHintProps {
  show: boolean;
}

const ChatDragHint: React.FC<ChatDragHintProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap animate-bounce z-10">
      Drag me to move!
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
      </div>
    </div>
  );
};

export default ChatDragHint;
