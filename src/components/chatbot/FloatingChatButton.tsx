
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import ChatbotDialog from './ChatbotDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const FloatingChatButton = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-[9999] bg-primary text-primary-foreground hover:bg-primary/90"
              size="icon"
              aria-label="Open TaskAssistant AI"
            >
              <Bot className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>TaskAssistant AI</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <ChatbotDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
};

export default FloatingChatButton;

