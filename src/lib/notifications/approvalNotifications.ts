import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TimeEntryApprovalEvent {
  orgId: string;
  teamId?: string | null;
  entry: {
    id: string;
    user_id: string;
    user_name: string;
    duration_minutes: number;
    work_date: string;
    notes?: string;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
  };
  actor: {
    id: string;
    name: string;
    email: string;
  };
  approval_notes?: string;
}

export const approvalNotifications = {
  // Send notification when time entry is approved
  notifyTimeEntryApproved: async (eventData: TimeEntryApprovalEvent) => {
    try {
      await supabase.functions.invoke('send-schedule-notifications', {
        body: {
          type: 'time_entry_approved',
          orgId: eventData.orgId,
          teamId: eventData.teamId,
          entry: eventData.entry,
          approver: eventData.approver || eventData.actor,
          actor: eventData.actor,
          timestamp: new Date().toISOString(),
          dedupeKey: `time_entry_approved_${eventData.entry.id}_${Date.now()}`
        }
      });
    } catch (error) {
      console.error('[APPROVAL_NOTIFY] Error in notifyTimeEntryApproved:', error);
    }
  },

  // Send notification when time entry is rejected
  notifyTimeEntryRejected: async (eventData: TimeEntryApprovalEvent) => {
    try {
      await supabase.functions.invoke('send-schedule-notifications', {
        body: {
          type: 'time_entry_rejected',
          orgId: eventData.orgId,
          teamId: eventData.teamId,
          entry: eventData.entry,
          approver: eventData.approver || eventData.actor,
          actor: eventData.actor,
          approval_notes: eventData.approval_notes,
          timestamp: new Date().toISOString(),
          dedupeKey: `time_entry_rejected_${eventData.entry.id}_${Date.now()}`
        }
      });
    } catch (error) {
      console.error('[APPROVAL_NOTIFY] Error in notifyTimeEntryRejected:', error);
    }
  },

  // Send UI feedback notification
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  warning: (message: string) => toast.warning(message),
  info: (message: string) => toast.info(message),
};