import React, { useState } from 'react';
import { Smile, ThumbsUp, Heart, ThumbsDown, Laugh, Frown, Plus } from 'lucide-react';
import EmojiPickerButton from './EmojiPickerButton';
import { Button } from "@/components/ui/button";

const DEFAULT_REACTIONS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '😮', label: 'Surprised' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😠', label: 'Angry' }
];

interface MessageReactionsProps {
  messageId: string;
}

type ReactionState = {
  [emoji: string]: { count: number; reacted: boolean };
};

const MessageReactions: React.FC<MessageReactionsProps> = ({ messageId }) => {
  // Key reactions by messageId (simple local state only)
  const [reactions, setReactions] = useState<ReactionState>(() => {
    // Example initial empty state
    return {};
  });
  const [pickerOpen, setPickerOpen] = useState(false);

  // Toggle reaction for user
  const toggleReaction = (emoji: string) => {
    setReactions(prev => {
      const current = prev[emoji] || { count: 0, reacted: false };
      if (current.reacted) {
        // Remove user reaction
        return { 
          ...prev, 
          [emoji]: { count: Math.max(0, current.count - 1), reacted: false } 
        };
      } else {
        // Add user reaction
        return { 
          ...prev, 
          [emoji]: { count: current.count + 1, reacted: true } 
        };
      }
    });
  };

  // Handle new emoji from picker
  const handleEmojiPick = (emoji: string) => {
    setReactions(prev => {
      if (prev[emoji]?.reacted) return prev; // Don't add again
      return {
        ...prev,
        [emoji]: { count: 1, reacted: true }
      };
    });
    setPickerOpen(false);
  };

  // Show all emojis that have been used, plus default set
  const allEmojis = [
    ...DEFAULT_REACTIONS.filter(er => !(er.emoji in reactions)), // Only those not added already
    ...Object.keys(reactions)
      .filter(e => reactions[e].count > 0 && !DEFAULT_REACTIONS.some(er => er.emoji === e))
      .map(emoji => ({ emoji, label: '' })),
  ];

  return (
    <div className="flex flex-wrap gap-2 items-center mt-2">
      {/* Existing reactions */}
      {Object.entries(reactions)
        .filter(([_, v]) => v.count > 0)
        .map(([emoji, val]) => (
        <Button
          key={emoji}
          variant={val.reacted ? "secondary" : "ghost"}
          size="sm"
          className="px-2 h-7 flex gap-1 items-center border rounded-full"
          onClick={() => toggleReaction(emoji)}
          aria-label={`React with ${emoji}`}
        >
          <span className="text-lg">{emoji}</span>
          {!!val.count && <span className="text-xs">{val.count}</span>}
        </Button>
      ))}

      {/* Add icon/button for more reactions */}
      <EmojiPickerButton
        onEmojiClick={handleEmojiPick}
      />
    </div>
  );
};

export default MessageReactions;
