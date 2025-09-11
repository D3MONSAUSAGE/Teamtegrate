import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Enhanced notification system that handles multiple recipients and team hierarchy
 */
export const useEnhancedNotifications = () => {
  const { user } = useAuth();

  const sendNotificationToMultiple = async (
    recipientIds: string[],
    title: string,
    content: string,
    type: string,
    metadata?: any
  ) => {
    if (!user?.organizationId) return;

    try {
      const { data, error } = await supabase.rpc('send_notification_to_multiple', {
        recipient_ids: recipientIds,
        notification_title: title,
        notification_content: content,
        notification_type: type,
        org_id: user.organizationId,
        metadata_json: metadata || {}
      });

      if (error) {
        console.error('Error sending multiple notifications:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to send notifications:', error);
      throw error;
    }
  };

  const notifyTrainingCompletion = async (
    assignmentId: string,
    userId: string,
    contentTitle: string,
    completionScore?: number
  ) => {
    if (!user?.organizationId) return;

    try {
      // Get the user's manager
      const { data: managerId } = await supabase.rpc('get_user_team_manager', { 
        target_user_id: userId 
      });

      const recipients = [];
      
      if (managerId) {
        recipients.push(managerId);
      }

      // Also notify admins
      const { data: adminUsers } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', user.organizationId)
        .in('role', ['admin', 'superadmin']);

      if (adminUsers) {
        recipients.push(...adminUsers.map(u => u.id));
      }

      if (recipients.length > 0) {
        await sendNotificationToMultiple(
          recipients,
          'Training Completed',
          `Team member has completed training: "${contentTitle}"${completionScore ? ` (Score: ${completionScore}%)` : ''}`,
          'training_completed',
          {
            assignment_id: assignmentId,
            completed_by: userId,
            completion_score: completionScore
          }
        );
      }
    } catch (error) {
      console.error('Error notifying training completion:', error);
    }
  };

  const notifyRequestSubmission = async (
    requestId: string,
    requestTitle: string,
    requestType: string,
    requestedBy: string
  ) => {
    if (!user?.organizationId) return;

    try {
      const recipients = [];

      // For time entry corrections, notify team manager first
      if (requestType === 'Time Entry Correction') {
        const { data: managerId } = await supabase.rpc('get_user_team_manager', { 
          target_user_id: requestedBy 
        });
        
        if (managerId) {
          recipients.push(managerId);
        }
      }

      // Always include admins as fallback approvers
      const { data: adminUsers } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', user.organizationId)
        .in('role', ['admin', 'superadmin']);

      if (adminUsers) {
        recipients.push(...adminUsers.map(u => u.id));
      }

      // Remove duplicates
      const uniqueRecipients = [...new Set(recipients)];

      if (uniqueRecipients.length > 0) {
        await sendNotificationToMultiple(
          uniqueRecipients,
          'New Request Needs Approval',
          `New ${requestType}: "${requestTitle}" requires your review`,
          'request_submitted',
          {
            request_id: requestId,
            request_type: requestType,
            requested_by: requestedBy
          }
        );
      }
    } catch (error) {
      console.error('Error notifying request submission:', error);
    }
  };

  const notifyRequestStatusChange = async (
    requestId: string,
    requestTitle: string,
    newStatus: string,
    requestedBy: string,
    approverName?: string
  ) => {
    if (!user?.organizationId) return;

    try {
      const statusMessages = {
        approved: 'has been approved',
        rejected: 'has been rejected',
        in_progress: 'is now in progress',
        completed: 'has been completed'
      };

      const message = statusMessages[newStatus as keyof typeof statusMessages];
      if (!message) return;

      await sendNotificationToMultiple(
        [requestedBy],
        'Request Status Update',
        `Your request "${requestTitle}" ${message}${approverName ? ` by ${approverName}` : ''}`,
        `request_${newStatus}`,
        {
          request_id: requestId,
          new_status: newStatus,
          approver_name: approverName
        }
      );
    } catch (error) {
      console.error('Error notifying request status change:', error);
    }
  };

  return {
    sendNotificationToMultiple,
    notifyTrainingCompletion,
    notifyRequestSubmission,
    notifyRequestStatusChange
  };
};