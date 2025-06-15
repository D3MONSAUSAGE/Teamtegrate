
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, X } from 'lucide-react';
import { User } from '@/types';

interface TeamAssignmentCardProps {
  selectedUsers: User[];
  setSelectedUsers: (users: User[]) => void;
  userSearchQuery: string;
  setUserSearchQuery: (query: string) => void;
  users: User[];
  loadingUsers: boolean;
}

const TeamAssignmentCard: React.FC<TeamAssignmentCardProps> = ({
  selectedUsers,
  setSelectedUsers,
  userSearchQuery,
  setUserSearchQuery,
  users,
  loadingUsers
}) => {
  const addUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setUserSearchQuery('');
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const filteredUsers = users.filter(user => 
    !selectedUsers.find(u => u.id === user.id) &&
    (user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
     user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  return (
    <Card className="border-2 border-emerald-500/10 shadow-lg">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold text-emerald-600">
            <Users className="h-5 w-5" />
            Team Assignment
          </div>
          <Badge variant="secondary" className="text-xs">
            {selectedUsers.length} member{selectedUsers.length !== 1 ? 's' : ''} assigned
          </Badge>
        </div>

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
          <Input
            placeholder="Search team members..."
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            className="border-2 focus:border-emerald-500"
          />
          
          {userSearchQuery && (
            <div className="max-h-40 overflow-y-auto border rounded-lg bg-background">
              {filteredUsers.length > 0 ? (
                filteredUsers.slice(0, 5).map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => addUser(user)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user.name?.charAt(0) || user.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="font-medium">{user.name || user.email}</div>
                      {user.name && (
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-muted-foreground">
                  No team members found
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamAssignmentCard;
