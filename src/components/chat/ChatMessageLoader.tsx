
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ChatMessageLoaderProps {
  isLoading: boolean;
  hasMoreMessages: boolean;
  loadMoreMessages: () => void;
}

const ChatMessageLoader: React.FC<ChatMessageLoaderProps> = ({
  isLoading,
  hasMoreMessages,
  loadMoreMessages
}) => {
  return (
    <>
      {isLoading && (
        <div className="flex justify-center items-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      
      {hasMoreMessages && !isLoading && (
        <div className="flex justify-center my-2">
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs"
            onClick={loadMoreMessages}
          >
            Load earlier messages
          </Button>
        </div>
      )}
    </>
  );
};

export default ChatMessageLoader;
