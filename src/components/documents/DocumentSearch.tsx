import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface DocumentSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const DocumentSearch = ({ searchQuery, onSearchChange }: DocumentSearchProps) => {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        type="text"
        placeholder="Search documents by name, type, or folder..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};

export default DocumentSearch;