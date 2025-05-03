
import { supabase } from '@/integrations/supabase/client';

export const fetchAllTaskComments = async () => {
  const { data: commentData, error: commentError } = await supabase
    .from('comments')
    .select('*');

  if (commentError) {
    console.error('Error fetching comments:', commentError);
    return null;
  }

  console.log(`Fetched ${commentData?.length || 0} comments from database`);
  return commentData;
};
