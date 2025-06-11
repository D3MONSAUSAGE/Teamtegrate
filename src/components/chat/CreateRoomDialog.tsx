import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Chat room name must be at least 2 characters.",
  }),
});

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomCreated?: (room: any) => void;
}

const CreateRoomDialog: React.FC<CreateRoomDialogProps> = ({
  open,
  onOpenChange,
  onRoomCreated
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: any) => {
    if (!user?.organizationId) {
      toast.error('Organization context required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { data: roomData, error } = await supabase
        .from('chat_rooms')
        .insert({
          name: data.name,
          created_by: user.id,
          organization_id: user.organizationId
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Chat room created successfully!');
      reset();
      onOpenChange(false);
      onRoomCreated?.(roomData);
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create chat room');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Create Room</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Chat Room</DialogTitle>
          <DialogDescription>
            Create a new chat room to collaborate with your team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Room Name</Label>
            <Input id="name" placeholder="Enter room name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name?.message}</p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Room"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoomDialog;
