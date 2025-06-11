
import { supabase } from '@/integrations/supabase/client';

/**
 * Create a notification for project team addition
 */
export const createProjectTeamAdditionNotification = async (
  userId: string,
  projectTitle: string,
  adderName: string,
  organizationId: string
): Promise<void> => {
  try {
    const notificationContent = `You've been added to project: ${projectTitle} by ${adderName}`;
    
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Added to Project Team',
      content: notificationContent,
      type: 'project_team_addition',
      organization_id: organizationId
    });
    
    console.log('Project team addition notification created for user:', userId);
  } catch (error) {
    console.error('Error sending project team addition notification:', error);
    // Don't block the team addition if notification fails
  }
};
