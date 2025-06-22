
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface MissingUser {
  auth_user_id: string;
  auth_email: string;
  auth_created_at: string;
  missing_from_public: boolean;
}

export const useDataSync = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const checkMissingUsers = async (): Promise<MissingUser[]> => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.rpc('find_missing_users');
      
      if (error) {
        console.error('Error checking missing users:', error);
        toast.error('Failed to check for missing users');
        return [];
      }

      const missingUsers = data?.filter((user: MissingUser) => user.missing_from_public) || [];
      
      if (missingUsers.length > 0) {
        console.log('Found missing users:', missingUsers);
        toast.warning(`Found ${missingUsers.length} users missing from public.users table`);
      } else {
        toast.success('All auth users are properly synced');
      }

      return missingUsers;
    } catch (error) {
      console.error('Error in checkMissingUsers:', error);
      toast.error('Failed to check user synchronization');
      return [];
    } finally {
      setIsChecking(false);
    }
  };

  const syncMissingUsers = async (missingUsers: MissingUser[]) => {
    if (missingUsers.length === 0) {
      toast.info('No users to sync');
      return;
    }

    setIsSyncing(true);
    try {
      // This would need to be implemented as an edge function or RPC
      // For now, we'll just log and notify
      console.log('Would sync these users:', missingUsers);
      toast.info(`Would sync ${missingUsers.length} missing users. Contact administrator.`);
    } catch (error) {
      console.error('Error syncing users:', error);
      toast.error('Failed to sync missing users');
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isChecking,
    isSyncing,
    checkMissingUsers,
    syncMissingUsers
  };
};
