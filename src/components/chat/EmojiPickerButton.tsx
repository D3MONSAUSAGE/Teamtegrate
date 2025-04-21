
import React, { useState, useRef, lazy, Suspense } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";
import type { EmojiClickData, EmojiStyle } from "emoji-picker-react";

// Lazy load the emoji picker for better performance
const Picker = lazy(() => import("emoji-picker-react"));

interface EmojiPickerButtonProps {
  onEmojiClick: (emoji: string) => void;
}

const EmojiPickerButton: React.FC<EmojiPickerButtonProps> = ({ onEmojiClick }) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Add emoji"
          className="hover:bg-accent rounded-full p-1 transition-colors"
        >
          <Smile className="h-5 w-5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="p-0 w-auto">
        <div style={{ minWidth: 280, maxHeight: 400, overflow: "auto" }}>
          <Suspense fallback={<div className="p-4 text-center">Loading emoji picker...</div>}>
            {open && (
              <Picker
                onEmojiClick={(emojiData: EmojiClickData) => {
                  onEmojiClick(emojiData.emoji);
                  setOpen(false);
                }}
                emojiStyle="apple"
                lazyLoadEmojis
                height={380}
              />
            )}
          </Suspense>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPickerButton;
