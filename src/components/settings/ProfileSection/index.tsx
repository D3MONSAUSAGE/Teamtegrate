
import React, { useState, useEffect } from "react";
import { toast } from '@/components/ui/sonner';
import ProfileInfoForm from "./ProfileInfoForm";
import ProfileAvatar from "./ProfileAvatar";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

const ProfileSection = () => {
  const { user, updateUserProfile } = useAuth();
  const [name, setName] = useState<string>(user?.name || user?.email || "");
  const [email, setEmail] = useState<string>(user?.email || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update local state when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || user.email || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Fetch the user's avatar URL when component mounts
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('avatar_url')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching avatar:", error);
          return;
        }
        
        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      } catch (error) {
        console.error("Error fetching avatar:", error);
      }
    };
    
    fetchAvatar();
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    setIsLoading(true);
    try {
      const updates: { name?: string; email?: string } = {};
      
      if (name !== user.name) {
        updates.name = name;
      }
      
      if (email !== user.email) {
        updates.email = email;
        toast.info("Email change may require Google Calendar re-authentication");
      }

      if (Object.keys(updates).length > 0) {
        await updateUserProfile(updates);
        toast.success("Profile updated successfully!");
      } else {
        toast.info("No changes to save");
      }
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
            user={{ 
              id: user.id, 
              name: user.name || user.email || 'User'
            }} 
            setAvatarUrl={setAvatarUrl} 
            avatarUrl={avatarUrl} 
          />
          
          <ProfileInfoForm
            user={{
              id: user.id,
              name: user.name || user.email || 'User',
              email: user.email,
              role: user.role
            }}
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            onSave={handleSave}
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSection;
