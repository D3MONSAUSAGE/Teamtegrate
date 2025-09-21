import { supabase } from '@/integrations/supabase/client';

interface NotificationParams {
  userIds: string[];
  title: string;
  content: string;
  type: string;
  organizationId: string;
}

export const createMeetingNotifications = async (params: NotificationParams) => {
  const { userIds, title, content, type, organizationId } = params;

  const notifications = userIds.map(userId => ({
    user_id: userId,
    title,
    content,
    type,
    organization_id: organizationId,
  }));

  const { error } = await supabase
    .from('notifications')
    .insert(notifications);

  if (error) {
    console.error('Error creating notifications:', error);
    throw error;
  }

  console.log(`✅ Created ${notifications.length} notifications`);
};

export const sendMeetingEmailNotification = async (params: {
  organizer_email: string;
  organizer_name: string;
  participant_name: string;
  meeting_title: string;
  meeting_start_time: string;
  meeting_location?: string;
  response_type: string;
}) => {
  try {
    const { error } = await supabase.functions.invoke('send-meeting-notification', {
      body: params
    });

    if (error) {
      console.error('❌ Failed to send email notification:', error);
      throw error;
    }

    console.log('✅ Email notification sent successfully');
  } catch (error) {
    console.error('❌ Error sending email notification:', error);
    throw error;
  }
};