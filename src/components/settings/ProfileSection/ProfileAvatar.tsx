import React, { useRef, useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Camera } from "lucide-react";
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface ProfileAvatarProps {
  user: { id: string; name: string };
  setAvatarUrl: (url: string) => void;
  avatarUrl: string | null;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ user, setAvatarUrl, avatarUrl }) => {
  console.log("ProfileAvatar rendering");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      // Verify we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast.error("Please log in again to upload your avatar");
        return;
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error("Error uploading avatar: " + uploadError.message);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("profiles")
        .getPublicUrl(filePath);

      // Update user profile in database
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        toast.error("Error updating profile: " + updateError.message);
        return;
      }

      setAvatarUrl(publicUrl);
      toast.success("Avatar updated successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("An unexpected error occurred while uploading your avatar");
    } finally {
      setUploading(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  console.log("ProfileAvatar about to render Avatar and button");

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
        <button
          onClick={triggerFileInput}
          disabled={uploading}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 dark:border-gray-700 dark:bg-[#181928]/70"
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
        </button>
      </div>
    </div>
  );
};

export default ProfileAvatar;
