
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, X, Search, AlertCircle } from 'lucide-react';
import { User } from '@/types';

interface TeamAssignmentCardProps {
  selectedUsers: User[];
  setSelectedUsers: (users: User[]) => void;
  users: User[];
  loadingUsers: boolean;
}

const TeamAssignmentCard: React.FC<TeamAssignmentCardProps> = ({
  selectedUsers,
  setSelectedUsers,
  users,
  loadingUsers
}) => {
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const addUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setUserSearchQuery('');
    setShowSearchResults(false);
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  // Filter users based on search query and exclude already selected users
  const filteredUsers = users.filter(user => {
    const isAlreadySelected = selectedUsers.find(u => u.id === user.id);
    const matchesSearch = userSearchQuery.trim() === '' || 
      user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearchQuery.toLowerCase());
    
    return !isAlreadySelected && matchesSearch;
  });

  // Show search results when user types
  useEffect(() => {
    setShowSearchResults(userSearchQuery.trim().length > 0);
  }, [userSearchQuery]);

  // Hide search results when clicking outside (simplified)
  const handleSearchInputBlur = () => {
    setTimeout(() => setShowSearchResults(false), 200);
  };

  return (
    <div className="space-y-4">
      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Assigned Team Members</Label>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2"
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {user.name?.charAt(0) || user.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {user.name || user.email}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUser(user.id)}
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Team Members */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Add Team Members</Label>
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members by name or email..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              onFocus={() => userSearchQuery.trim() && setShowSearchResults(true)}
              onBlur={handleSearchInputBlur}
              className="pl-10 border-2 focus:border-emerald-500"
            />
          </div>
          
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto border rounded-lg bg-background shadow-lg">
              {loadingUsers ? (
                <div className="p-3 text-center text-muted-foreground">
                  <Search className="h-4 w-4 animate-pulse mx-auto mb-1" />
                  Searching...
                </div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.slice(0, 8).map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => addUser(user)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user.name?.charAt(0) || user.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{user.name || user.email}</div>
                      {user.name && (
                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                  </button>
                ))
              ) : userSearchQuery.trim() ? (
                <div className="p-3 text-center text-muted-foreground">
                  <AlertCircle className="h-4 w-4 mx-auto mb-1" />
                  <div className="text-sm">No team members found for "{userSearchQuery}"</div>
                  <div className="text-xs">Try different search terms</div>
                </div>
              ) : users.length === 0 ? (
                <div className="p-3 text-center text-muted-foreground">
                  <Users className="h-4 w-4 mx-auto mb-1" />
                  <div className="text-sm">No team members available</div>
                  <div className="text-xs">Add users to your organization first</div>
                </div>
              ) : (
                <div className="p-3 text-center text-muted-foreground">
                  <Users className="h-4 w-4 mx-auto mb-1" />
                  <div className="text-sm">All users already assigned</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {selectedUsers.length} member{selectedUsers.length !== 1 ? 's' : ''} assigned
        </span>
        <span>
          {users.length} total available
        </span>
      </div>
    </div>
  );
};

export default TeamAssignmentCard;
