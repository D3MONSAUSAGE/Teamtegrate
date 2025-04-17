
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AvatarUploadSection } from './AvatarUploadSection';
import { ProfileForm } from './ProfileForm';

const ProfileSection = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
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
            console.error('Error fetching user data:', error);
            return;
          }
          
          if (data?.avatar_url) {
            setAvatarUrl(data.avatar_url);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };
      
      fetchProfile();
    }
  }, [user]);
  
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { name }
      });

      if (authError) {
        toast.error('Failed to update auth profile: ' + authError.message);
        return;
      }

      const { error: dbError } = await supabase
        .from('users')
        .update({ 
          name, 
          avatar_url: avatarUrl || null 
        })
        .eq('id', user?.id);

      if (dbError) {
        toast.error('Failed to update database profile: ' + dbError.message);
        return;
      }

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
      <div className="bg-white p-6 rounded-lg border space-y-6">
        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
          <AvatarUploadSection
            userId={user?.id || ''}
            userName={user?.name || ''}
            avatarUrl={avatarUrl}
            onAvatarUpdate={(url) => setAvatarUrl(url)}
          />
          
          <ProfileForm
            name={name}
            email={user?.email}
            role={user?.role}
            onNameChange={setName}
          />
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
