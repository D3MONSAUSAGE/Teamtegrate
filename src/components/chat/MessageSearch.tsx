import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { ChatMessage } from '@/types/chat';

interface MessageSearchProps {
  messages: ChatMessage[];
  onMessageSelect: (messageId: string) => void;
  className?: string;
}

export const MessageSearch: React.FC<MessageSearchProps> = ({
  messages,
  onMessageSelect,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);

  // Filter messages based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return messages.filter(message => 
      message.content.toLowerCase().includes(query) &&
      !message.deleted_at
    );
  }, [messages, searchQuery]);

  // Reset current index when search results change
  useEffect(() => {
    setCurrentResultIndex(0);
  }, [searchResults]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setIsOpen(value.length > 0);
  };

  const navigateResults = (direction: 'up' | 'down') => {
    if (searchResults.length === 0) return;
    
    let newIndex;
    if (direction === 'up') {
      newIndex = currentResultIndex > 0 ? currentResultIndex - 1 : searchResults.length - 1;
    } else {
      newIndex = currentResultIndex < searchResults.length - 1 ? currentResultIndex + 1 : 0;
    }
    
    setCurrentResultIndex(newIndex);
    onMessageSelect(searchResults[newIndex].id);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsOpen(false);
    setCurrentResultIndex(0);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 p-3 border-b border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search messages..."
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {searchResults.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {currentResultIndex + 1} of {searchResults.length}
            </Badge>
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateResults('up')}
                disabled={searchResults.length === 0}
                className="h-8 w-8"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateResults('down')}
                disabled={searchResults.length === 0}
                className="h-8 w-8"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {isOpen && searchQuery && searchResults.length === 0 && (
        <div className="p-4 text-center text-muted-foreground border-b border-border/50">
          No messages found for "{searchQuery}"
        </div>
      )}
    </div>
  );
};