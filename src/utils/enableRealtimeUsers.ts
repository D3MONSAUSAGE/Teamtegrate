
import { supabase } from '@/integrations/supabase/client';

// Function to enable real-time updates for users table
export const enableRealtimeUsers = async () => {
  try {
    console.log('Enabling real-time updates for users table...');
    
    // Enable replica identity for the users table
    const { error: replicaError } = await supabase.rpc('sql', {
      query: 'ALTER TABLE public.users REPLICA IDENTITY FULL;'
    });
    
    if (replicaError) {
      console.error('Error setting replica identity:', replicaError);
    }

    // Add the users table to the realtime publication
    const { error: publicationError } = await supabase.rpc('sql', {
      query: 'ALTER PUBLICATION supabase_realtime ADD TABLE public.users;'
    });
    
    if (publicationError) {
      console.error('Error adding to realtime publication:', publicationError);
    }

    console.log('Real-time updates enabled for users table');
  } catch (error) {
    console.error('Error enabling real-time updates:', error);
  }
};
