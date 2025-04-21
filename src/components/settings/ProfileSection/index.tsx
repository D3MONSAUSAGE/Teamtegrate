
import React, { useState } from "react";
import { toast } from '@/components/ui/sonner';
import ProfileInfoForm from "./ProfileInfoForm";
import ProfileAvatar from "./ProfileAvatar";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const ProfileSection = () => {
  const { user } = useAuth();
  const [name, setName] = useState<string>(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name }
      });

      if (error) {
        throw error;
      }

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Profile</h2>
      <div className="bg-card dark:bg-[#1f2133] p-6 rounded-lg border border-border dark:border-gray-800">
        <div className="flex flex-col md:flex-row md:items-start gap-8">
          <ProfileAvatar 
            user={user} 
            setAvatarUrl={setAvatarUrl} 
            avatarUrl={avatarUrl} 
          />
          
          <ProfileInfoForm
            user={user}
            name={name}
            setName={setName}
            onSave={handleSave}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
