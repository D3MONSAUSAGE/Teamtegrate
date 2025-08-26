import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface ReactionGroup {
  emoji: string;
  count: number;
  users: string[];
  hasCurrentUser: boolean;
}

interface MessageReactionsProps {
  messageId: string;
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥'];

const MessageReactions: React.FC<MessageReactionsProps> = ({ messageId }) => {
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Fetch reactions for this message
  useEffect(() => {
    const fetchReactions = async () => {
      if (!messageId) return;

      const { data, error } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId);

      if (error) {
        console.error('Error fetching reactions:', error);
        return;
      }

      setReactions(data || []);
    };

    fetchReactions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('message-reactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=eq.${messageId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReactions((prev) => [...prev, payload.new as MessageReaction]);
          } else if (payload.eventType === 'DELETE') {
            setReactions((prev) => prev.filter((r) => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId]);

  // Group reactions by emoji
  const reactionGroups = reactions.reduce((groups: ReactionGroup[], reaction) => {
    const existing = groups.find((g) => g.emoji === reaction.emoji);
    if (existing) {
      existing.count++;
      existing.users.push(reaction.user_id);
      if (reaction.user_id === user?.id) {
        existing.hasCurrentUser = true;
      }
    } else {
      groups.push({
        emoji: reaction.emoji,
        count: 1,
        users: [reaction.user_id],
        hasCurrentUser: reaction.user_id === user?.id,
      });
    }
    return groups;
  }, []);

  const handleReactionClick = async (emoji: string) => {
    if (!user || loading) return;
    setLoading(true);

    try {
      const existingReaction = reactions.find(
        (r) => r.emoji === emoji && r.user_id === user.id
      );

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (error) throw error;
      } else {
        // Add reaction - organization_id will be set by the trigger
        const { error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji,
            organization_id: '00000000-0000-0000-0000-000000000000' // Placeholder, will be set by trigger
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    } finally {
      setLoading(false);
    }
  };

  if (reactionGroups.length === 0) {
    return (
      <div className="flex items-center gap-1 mt-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-4 gap-1">
              {COMMON_EMOJIS.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-lg hover:bg-accent"
                  onClick={() => handleReactionClick(emoji)}
                  disabled={loading}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 mt-1">
      {reactionGroups.map((group) => (
        <Button
          key={group.emoji}
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 px-2 py-0 text-xs rounded-full border transition-colors",
            group.hasCurrentUser
              ? "bg-primary/10 border-primary/20 text-primary"
              : "bg-muted border-muted-foreground/20 hover:bg-accent"
          )}
          onClick={() => handleReactionClick(group.emoji)}
          disabled={loading}
        >
          <span className="mr-1">{group.emoji}</span>
          <span>{group.count}</span>
        </Button>
      ))}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="grid grid-cols-4 gap-1">
            {COMMON_EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:bg-accent"
                onClick={() => handleReactionClick(emoji)}
                disabled={loading}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MessageReactions;