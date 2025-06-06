
import React from 'react';
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatResetButtonProps {
  onReset: () => void;
  show: boolean;
}

const ChatResetButton: React.FC<ChatResetButtonProps> = ({ onReset, show }) => {
  if (!show) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="absolute -top-8 -left-8 h-6 w-6 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background transition-colors"
          onClick={onReset}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Reset position</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default ChatResetButton;
