
import React, { useState } from "react";
import { toast } from '@/components/ui/sonner';
import ProfileInfoForm from "./ProfileInfoForm";
import ProfileAvatar from "./ProfileAvatar";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

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
    <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-[#1f2133] dark:to-[#181928]/50 border-none shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-semibold text-primary">
          <User className="w-6 h-6" />
          Profile Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 bg-white/50 dark:bg-[#1f2133]/70 rounded-b-lg p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-8 animate-fade-in">
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
      </CardContent>
    </Card>
  );
};

export default ProfileSection;
