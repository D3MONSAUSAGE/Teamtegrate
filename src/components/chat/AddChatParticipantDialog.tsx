
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

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
  onAdded,
}) => {
  const [search, setSearch] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const { user: currentUser } = useAuth();
  const isMobile = useIsMobile();

  // Fetch users not already in the room, optionally filtered by search
  const { data: availableUsers = [], isLoading } = useQuery({
    queryKey: ["search-users", roomId, search],
    queryFn: async () => {
      // Get user IDs already in room
      const { data: participants } = await supabase
        .from("chat_room_participants")
        .select("user_id")
        .eq("room_id", roomId);
      const participantIds = participants?.map(p => p.user_id);

      // Fetch users (excluding members already in the room)
      let query = supabase
        .from("users")
        .select("id, name, email")
        .order("name");
      if (search.trim()) {
        query = query.ilike("name", `%${search.trim()}%`);
      }
      const { data: users, error } = await query;
      if (error) throw error;
      return users.filter((u) => !participantIds?.includes(u.id));
    },
    enabled: open,
  });

  const handleAddParticipant = async (userId: string) => {
    setAddingId(userId);
    try {
      // Get current user & room details for notifications
      const { data: roomData } = await supabase
        .from("chat_rooms")
        .select("name")
        .eq("id", roomId)
        .single();

      // Add user to room
      const { error } = await supabase.from("chat_room_participants").insert({
        room_id: roomId,
        user_id: userId,
        added_by: currentUser?.id,
      });

      if (error) throw error;

      // Create system message in the chat to notify about the new participant
      const addedUser = availableUsers.find(user => user.id === userId);
      if (addedUser) {
        await supabase.from("chat_messages").insert({
          room_id: roomId,
          user_id: currentUser?.id || userId,
          content: `${addedUser.name} was added to the chat by ${currentUser?.name || "Admin"}`,
          type: "system"
        });

        // Insert a notification to the notifications table
        await supabase.from("notifications").insert({
          user_id: userId,
          title: "Chat Invitation",
          content: `You were added to "${roomData?.name || "a chat"}"`,
          type: "chat_invitation",
          read: false
        });
      }

      toast.success("Added to chat!");
      onAdded?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to add user: " + error.message);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isMobile ? "w-[95%] max-w-md p-4" : "max-w-md"}>
        <DialogHeader>
          <DialogTitle>Add Member to Chat</DialogTitle>
        </DialogHeader>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name"
          className="mb-4"
        />
        <div className="space-y-2 max-h-60 md:max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
            </div>
          ) : availableUsers.length === 0 ? (
            <div className="text-sm text-muted-foreground px-2 py-4 text-center">
              No users found.
            </div>
          ) : (
            availableUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between border-b pb-1">
                <div className={isMobile ? "max-w-[70%]" : ""}>
                  <span className="font-medium truncate block">{user.name}</span>
                  <span className="ml-0 text-xs text-muted-foreground truncate block">{user.email}</span>
                </div>
                <Button
                  size="sm"
                  disabled={!!addingId}
                  onClick={() => handleAddParticipant(user.id)}
                  className="gap-1"
                >
                  <UserPlus className="h-4 w-4" /> Add
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddChatParticipantDialog;
