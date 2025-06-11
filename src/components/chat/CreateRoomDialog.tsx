
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChatPermissions } from '@/hooks/use-chat-permissions';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  name: string;
}

const CreateRoomDialog: React.FC<CreateRoomDialogProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { canCreateRooms } = useChatPermissions();
  const { register, handleSubmit, reset } = useForm<FormData>();

  // Don't render if user can't create rooms
  if (!canCreateRooms()) {
    return null;
  }

  const onSubmit = async (data: FormData) => {
    if (!user || !user.organization_id) {
      toast.error("Organization not found");
      return;
    }

    try {
      const { data: roomData, error } = await supabase
        .from('chat_rooms')
        .insert({
          name: data.name,
          created_by: user.id,
          organization_id: user.organization_id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Add the room creator as a participant
      const { error: participantError } = await supabase
        .from('chat_room_participants')
        .insert({
          room_id: roomData.id,
          user_id: user.id,
          added_by: user.id,
        });

      if (participantError) {
        console.error('Error adding creator as participant:', participantError);
        // Don't throw error here as room was created successfully
      }

      toast.success('Chat room created successfully');
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create chat room');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Chat Room</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              {...register('name', { required: true })}
              placeholder="Enter room name"
            />
          </div>
          <Button type="submit" className="w-full">
            Create Room
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoomDialog;
