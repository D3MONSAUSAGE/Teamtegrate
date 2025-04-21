
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Loader2, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const ProfileSection = () => {
  const { user, updateUserProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('avatar_url')
            .eq('id', user.id)
            .maybeSingle();
            
          if (error) {
            console.error('Error fetching profile:', error);
            return;
          }
          
          if (data?.avatar_url) {
            setAvatarUrl(data.avatar_url);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      };
      
      fetchProfile();
    }
  }, [user]);
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Get current session first to ensure we have valid auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Authentication session not found. Please log in again.');
        return;
      }
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);
        
      if (uploadError) {
        toast.error('Error uploading avatar');
        console.error(uploadError);
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);
        
      if (updateError) {
        toast.error('Error updating profile');
        console.error(updateError);
        return;
      }
      
      setAvatarUrl(publicUrl);
      toast.success('Avatar updated successfully!');
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setUploading(false);
    }
  };
  
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      await updateUserProfile({ name });
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(`Failed to update profile: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
      <div className="bg-card dark:bg-[#1f2133] p-6 rounded-lg border border-border dark:border-gray-800 space-y-6">
        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24 border-2 border-gray-200 dark:border-gray-700">
              <AvatarImage src={avatarUrl || undefined} alt={user?.name || 'User'} />
              <AvatarFallback className="text-xl bg-primary/20 text-primary dark:bg-primary/30">
                {user?.name?.substring(0, 2).toUpperCase() || 'U'}
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
          
          <div className="flex-1 space-y-4 w-full">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background dark:bg-[#181928]/70"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                defaultValue={user?.email} 
                readOnly
                className="bg-background dark:bg-[#181928]/70"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input 
            id="role" 
            defaultValue={user?.role === 'manager' ? 'Manager' : 'User'} 
            readOnly 
            className="bg-background dark:bg-[#181928]/70"
          />
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Profile
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
