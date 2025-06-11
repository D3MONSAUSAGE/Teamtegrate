
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, UserPlus } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

export interface AddChatParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  onAdded?: () => void;
}

const AddChatParticipantDialog: React.FC<AddChatParticipantDialogProps> = ({
  open,
  onOpenChange,
  roomId,
  onAdded
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useAuth();

  const fetchUsers = async (query: string) => {
    if (!query.trim() || !user?.organizationId) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('organization_id', user.organizationId)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const addParticipant = async (userId: string) => {
    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('chat_room_participants')
        .insert({
          room_id: roomId,
          user_id: userId,
          added_by: user?.id
        });

      if (error) throw error;

      toast.success('Participant added successfully');
      onAdded?.();
      onOpenChange(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding participant:', error);
      toast.error('Failed to add participant');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Participant</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="search">Search Users</Label>
            <Input
              id="search"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                fetchUsers(e.target.value);
              }}
            />
          </div>

          {searchResults.length > 0 && (
            <ScrollArea className="h-48 border rounded-md p-2">
              <div className="space-y-2">
                {searchResults.map((foundUser) => (
                  <div key={foundUser.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <div>
                        <p className="text-sm font-medium">{foundUser.name}</p>
                        <p className="text-xs text-gray-500">{foundUser.email}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => addParticipant(foundUser.id)}
                      disabled={isAdding}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {isSearching && (
            <p className="text-center text-sm text-gray-500">Searching...</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddChatParticipantDialog;
