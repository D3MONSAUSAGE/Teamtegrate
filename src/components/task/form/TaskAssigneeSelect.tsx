
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search } from 'lucide-react';
import { AppUser } from '@/types';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TaskAssigneeSelectProps {
  selectedMember: string | undefined;
  onAssign: (userId: string) => void;
  users: AppUser[];
  isLoading: boolean;
}

const TaskAssigneeSelect: React.FC<TaskAssigneeSelectProps> = ({
  selectedMember,
  onAssign,
  users,
  isLoading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    (user.name?.toLowerCase() || user.email.toLowerCase()).includes(searchQuery.toLowerCase())
  );
  
  // Get selected user for display in the trigger
  const selectedUser = users.find(user => user.id === selectedMember);
  
  return (
    <div className="space-y-2">
      <Label htmlFor="assignedTo">Assigned To</Label>
      <Select
        value={selectedMember}
        onValueChange={onAssign}
      >
        <SelectTrigger id="assignedTo" className="w-full flex items-center gap-2">
          {selectedMember && selectedUser ? (
            <div className="flex items-center gap-2 max-w-[90%] truncate">
              <Avatar className="h-5 w-5">
                <AvatarImage src={selectedUser?.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {(selectedUser?.name?.[0] || selectedUser?.email[0] || '').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <SelectValue className="truncate" placeholder="Assign to user (optional)" />
            </div>
          ) : (
            <SelectValue placeholder="Assign to user (optional)" />
          )}
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 py-2">
            <div className="flex items-center px-1 mb-2 border rounded-md focus-within:ring-1 focus-within:ring-primary">
              <Search className="h-4 w-4 text-muted-foreground mr-2" />
              <Input 
                placeholder="Search users..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-8"
              />
            </div>
          </div>
          
          <SelectGroup>
            <SelectItem value="unassigned" className="flex items-center">
              <span className="font-medium">Unassigned</span>
            </SelectItem>
          </SelectGroup>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
              <span>Loading users...</span>
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <SelectGroup>
              <SelectLabel className="text-xs text-muted-foreground">Team Members</SelectLabel>
              {filteredUsers.map(user => (
                <SelectItem key={user.id} value={user.id} className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {(user.name?.[0] || user.email[0] || '').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{user.name || user.email}</span>
                  {user.role && <span className="text-xs text-muted-foreground ml-1">({user.role})</span>}
                </SelectItem>
              ))}
            </SelectGroup>
          ) : searchQuery ? (
            <div className="text-sm text-muted-foreground p-3 text-center">
              No users match your search
            </div>
          ) : (
            <div className="text-sm text-muted-foreground p-3 text-center">
              No users found
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TaskAssigneeSelect;
