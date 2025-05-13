
import { supabase } from '@/integrations/supabase/client';

export const fetchAllTaskComments = async () => {
  try {
    console.log('Fetching all task comments');
    
    const { data: commentData, error: commentError } = await supabase
      .from('comments')
      .select('*');

    if (commentError) {
      console.error('Error fetching comments:', commentError);
      return null;
    }

    console.log(`Fetched ${commentData?.length || 0} comments from database`);
    
    // Log some sample comments to debug
    if (commentData && commentData.length > 0) {
      console.log('Sample comment:', commentData[0]);
    }
    
    return commentData;
  } catch (err) {
    console.error('Unexpected error in fetchAllTaskComments:', err);
    return null;
  }
};
