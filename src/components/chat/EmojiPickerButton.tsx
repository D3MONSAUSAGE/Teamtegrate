
import React from 'react';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';

interface EmojiPickerButtonProps {
  onEmojiClick: (emoji: string) => void;
}

const EmojiPickerButton: React.FC<EmojiPickerButtonProps> = ({ onEmojiClick }) => {
  const commonEmojis = ['😀', '😂', '❤️', '👍', '👎', '😊', '😢', '😮', '😡', '🎉'];

  const handleEmojiClick = (emoji: string) => {
    onEmojiClick(emoji);
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
      >
        <Smile className="h-5 w-5 text-muted-foreground" />
      </Button>
    </div>
  );
};

export default EmojiPickerButton;
