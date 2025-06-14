
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AddChatParticipantDialogProps {
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
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleAddParticipant = async () => {
    if (!email.trim() || !user) return;

    try {
      setLoading(true);
      
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.trim())
        .single();

      if (userError || !userData) {
        toast.error('User not found');
        return;
      }

      // Add participant
      const { error } = await supabase
        .from('chat_participants')
        .insert({
          room_id: roomId,
          user_id: userData.id,
          role: 'member'
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('User is already a participant');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Participant added successfully');
      setEmail('');
      onOpenChange(false);
      onAdded?.();
    } catch (error) {
      console.error('Error adding participant:', error);
      toast.error('Failed to add participant');
    } finally {
      setLoading(false);
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
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter user email..."
              disabled={loading}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleAddParticipant} disabled={loading || !email.trim()}>
              {loading ? 'Adding...' : 'Add Participant'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddChatParticipantDialog;
