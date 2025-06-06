
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  roomId: string;
}

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onKeyDown,
  placeholder,
  disabled,
  className,
  roomId,
}) => {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionUsers, setMentionUsers] = useState<User[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (showMentions) {
      fetchRoomParticipants();
    }
  }, [showMentions, roomId]);

  const fetchRoomParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_room_participants')
        .select(`
          user_id,
          users!user_id(
            id,
            email,
            name
          )
        `)
        .eq('room_id', roomId);

      if (error) throw error;

      const users = data?.map(participant => ({
        id: participant.users.id,
        email: participant.users.email,
        name: participant.users.name,
      })).filter(user => user.id !== currentUser?.id) || [];

      setMentionUsers(users);
    } catch (error) {
      console.error('Error fetching room participants:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Check for @ mentions
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = newValue.slice(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
      setSelectedMentionIndex(0);
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (user: User) => {
    const cursorPosition = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      const beforeMention = textBeforeCursor.slice(0, mentionMatch.index);
      // Use the user's name (full name from profile settings) for the mention
      const newValue = `${beforeMention}@${user.name || user.email} ${textAfterCursor}`;
      onChange(newValue);
    }
    
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < mentionUsers.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : mentionUsers.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (mentionUsers[selectedMentionIndex]) {
          handleMentionSelect(mentionUsers[selectedMentionIndex]);
        }
        return;
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
    
    onKeyDown(e);
  };

  const filteredUsers = mentionUsers.filter(user =>
    (user.name || user.email).toLowerCase().includes(mentionQuery.toLowerCase())
  );

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
      
      {showMentions && filteredUsers.length > 0 && (
        <Card className="absolute bottom-full left-0 right-0 mb-2 max-h-48 overflow-y-auto z-50">
          {filteredUsers.map((user, index) => (
            <div
              key={user.id}
              className={`px-3 py-2 cursor-pointer hover:bg-accent ${
                index === selectedMentionIndex ? 'bg-accent' : ''
              }`}
              onClick={() => handleMentionSelect(user)}
            >
              <div className="font-medium">{user.name || user.email}</div>
              {user.name && user.email !== user.name && (
                <div className="text-xs text-muted-foreground">{user.email}</div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

export default MentionInput;
