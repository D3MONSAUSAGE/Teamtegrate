
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
  const [bucketExists, setBucketExists] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if profiles bucket exists on component mount
  useEffect(() => {
    const checkBucket = async () => {
      try {
        const { data, error } = await supabase.storage.getBucket('profiles');
        if (error && error.message.includes('not found')) {
          console.log('Profiles bucket does not exist');
          setBucketExists(false);
        } else if (data) {
          setBucketExists(true);
        }
      } catch (error) {
        console.error('Error checking bucket:', error);
        setBucketExists(false);
      }
    };

    checkBucket();
  }, []);

  const triggerFileInput = () => {
    if (!bucketExists) {
      toast.error("Avatar upload is not configured. Please contact support.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      if (!bucketExists) {
        toast.error("Avatar upload is not configured. Please contact support.");
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

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Verify we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast.error("Please log in again to upload your avatar");
        return;
      }

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
          disabled={uploading || !bucketExists}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={triggerFileInput}
          disabled={uploading || bucketExists === false}
          className="flex items-center dark:border-gray-700 dark:bg-[#181928]/70"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : bucketExists === false ? (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Upload Not Available
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Change Avatar
            </>
          )}
        </Button>
        {bucketExists === false && (
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Contact admin to enable avatar uploads
          </p>
        )}
      </div>
    </div>
  );
};

export default ProfileAvatar;
