
import React, { useRef, useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Camera } from "lucide-react";
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface ProfileAvatarProps {
  user: { id: string; name: string };
  setAvatarUrl: (url: string) => void;
  avatarUrl: string | null;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ user, setAvatarUrl, avatarUrl }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { data: { session }} = await supabase.auth.getSession();
      if (!session) {
        toast.error("Authentication session not found. Please log in again.");
        return;
      }

      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, file);

      if (uploadError) {
        toast.error("Error uploading avatar");
        console.error(uploadError);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("profiles")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) {
        toast.error("Error updating profile");
        console.error(updateError);
        return;
      }

      setAvatarUrl(publicUrl);
      toast.success("Avatar updated successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-24 w-24 border-2 border-gray-200 dark:border-gray-700">
        <AvatarImage src={avatarUrl || undefined} alt={user.name || "User"} />
        <AvatarFallback className="text-xl bg-primary/20 text-primary dark:bg-primary/30">
          {user.name?.substring(0, 2).toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
      <div>
        <input
          ref={fileInputRef}
          id="avatar"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
          disabled={uploading}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={triggerFileInput}
          disabled={uploading}
          className="flex items-center dark:border-gray-700 dark:bg-[#181928]/70"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Change Avatar
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProfileAvatar;
