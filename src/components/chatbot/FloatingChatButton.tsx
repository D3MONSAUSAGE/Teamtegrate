
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import ChatbotDialog from './ChatbotDialog';

const FloatingChatButton = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <Bot className="h-6 w-6" />
      </Button>
      
      <ChatbotDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
};

export default FloatingChatButton;
