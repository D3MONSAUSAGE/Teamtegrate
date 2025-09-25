
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useTimezone } from './useTimezone';

export const useUserTimezone = () => {
  const { user } = useAuth();
  const { detectedTimezone } = useTimezone();
  const [userTimezone, setUserTimezone] = useState<string>('UTC');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch user's saved timezone
  useEffect(() => {
    const fetchUserTimezone = async () => {
      console.log('🕐 useUserTimezone: fetchUserTimezone called', { user: !!user, detectedTimezone });
      
      if (!user) {
        console.log('🕐 useUserTimezone: no user, using detected timezone', detectedTimezone);
        setUserTimezone(detectedTimezone);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('timezone')
          .eq('id', user.id)
          .single();

        if (error) {
          console.log('🕐 useUserTimezone: error fetching user timezone, using detected', { error, detectedTimezone });
          // If no timezone is set, use detected timezone
          setUserTimezone(detectedTimezone);
        } else {
          const savedTimezone = data.timezone || detectedTimezone;
          console.log('🕐 useUserTimezone: fetched user timezone', { saved: data.timezone, detected: detectedTimezone, final: savedTimezone });
          setUserTimezone(savedTimezone);
        }
      } catch (error) {
        console.error('🕐 useUserTimezone: error in fetchUserTimezone', error);
        setUserTimezone(detectedTimezone);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserTimezone();
  }, [user, detectedTimezone]);

  // Update user's timezone in database
  const updateUserTimezone = async (newTimezone: string) => {
    if (!user) {
      toast.error('User not authenticated');
      return false;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ timezone: newTimezone })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user timezone:', error);
        toast.error('Failed to update timezone preference');
        return false;
      }

      setUserTimezone(newTimezone);
      toast.success('Timezone preference updated successfully');
      return true;
    } catch (error) {
      console.error('Error in updateUserTimezone:', error);
      toast.error('Failed to update timezone preference');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    userTimezone,
    isLoading,
    isUpdating,
    updateUserTimezone,
    detectedTimezone,
  };
};
