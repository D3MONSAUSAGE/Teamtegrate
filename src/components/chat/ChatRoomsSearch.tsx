
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ChatRoomsSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const ChatRoomsSearch: React.FC<ChatRoomsSearchProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input 
        placeholder="Search rooms..." 
        className="pl-9"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
};

export default ChatRoomsSearch;
