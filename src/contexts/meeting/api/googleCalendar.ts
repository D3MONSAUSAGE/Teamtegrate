import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface User {
  id: string;
  organizationId?: string;
}

interface SyncMeetingParams {
  meetingId: string;
  action: 'create' | 'update' | 'delete';
  user: User;
}

export const syncMeetingToGoogleAPI = async (params: SyncMeetingParams): Promise<boolean> => {
  const { meetingId, action, user } = params;
  
  if (!user) {
    toast({
      title: "Error",
      description: "Please sign in to sync meetings",
      variant: "destructive",
    });
    return false;
  }

  try {
    const { error } = await supabase.functions.invoke('sync-meeting-to-google', {
      body: { meetingId, action }
    });

    if (error) {
      throw error;
    }

    toast({
      title: "Success",
      description: "Meeting synced to Google Calendar successfully",
    });

    return true;
  } catch (error) {
    console.error('Error syncing meeting to Google:', error);
    toast({
      title: "Sync Failed",
      description: "Failed to sync meeting to Google Calendar. Please try again.",
      variant: "destructive",
    });
    return false;
  }
};