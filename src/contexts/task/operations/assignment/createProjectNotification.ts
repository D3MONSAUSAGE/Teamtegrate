
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
    
    await supabase.functions.invoke('send-push-notification', {
      body: {
        user_id: userId,
        title: 'Added to Project Team',
        content: notificationContent,
        type: 'project_team_addition',
        metadata: {
          route: '/dashboard/projects'
        },
        organization_id: organizationId,
        send_push: true
      }
    });
    
    console.log('Project team addition notification created for user:', userId);
  } catch (error) {
    console.error('Error sending project team addition notification:', error);
    // Don't block the team addition if notification fails
  }
};
