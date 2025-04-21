
import React, { useState, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";
import dynamic from "next/dynamic";

// EmojiPicker must be dynamically imported for SSR compatibility (if using Next.js/Vite).
const Picker = dynamic(() => import("emoji-picker-react"), { ssr: false });

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
          {/* @ts-ignore */}
          <Picker
            onEmojiClick={(_, emojiObject) => {
              // Support both old/new emoji picker api signatures
              onEmojiClick(emojiObject?.emoji || emojiObject);
              setOpen(false);
            }}
            emojiStyle="native"
            lazyLoadEmojis
            height={380}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPickerButton;

