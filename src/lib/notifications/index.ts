import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { getChecklistRecipients } from './recipients';

interface NotificationRecipient {
  id: string;
  email: string;
  name?: string;
  push_token?: string;
}

interface TicketNotificationData {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  created_at: string;
  organization_id: string;
  ticket_number?: string;
}

interface UserData {
  id: string;
  email: string;
  name?: string;
}

interface TaskNotificationData {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  deadline?: string;
  created_at: string;
  organization_id: string;
  project_title?: string;
}

interface InventoryNotificationData {
  id: string;
  count_date: string;
  status: string;
  organization_id: string;
  team_id?: string;
  template_id?: string;
  template_name?: string;
  team_name?: string;
  conducted_by: string;
  completion_percentage: number;
  variance_count: number;
  total_items_count: number;
  notes?: string;
}

// Centralized notification orchestrator - Frontend calls edge functions
export const notifications = {
  // Ticket Created - notify requester (confirmation) + admins (new ticket alert)
  async notifyTicketCreated(ticket: TicketNotificationData, user: UserData) {
    try {
      console.log(`[Notifications] Triggering ticket created notifications: ${ticket.id}`);

      // Call edge function to handle email + push notifications
      const { data, error } = await supabase.functions.invoke('send-ticket-notifications', {
        body: {
          type: 'ticket_created',
          ticket,
          user,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('[Notifications] Failed to send ticket created notifications:', error);
        throw error;
      }

      console.log('[Notifications] Ticket created notifications sent successfully:', data);
    } catch (error) {
      console.error('[Notifications] Error in notifyTicketCreated:', error);
      // Don't throw - notifications should not break the main flow
    }
  },

  // Ticket Assigned - notify new assignee
  async notifyTicketAssigned(ticket: TicketNotificationData, assignee: UserData, actor: UserData) {
    try {
      console.log(`[Notifications] Triggering ticket assigned notifications: ${ticket.id} to ${assignee.id}`);

      const { data, error } = await supabase.functions.invoke('send-ticket-notifications', {
        body: {
          type: 'ticket_assigned',
          ticket,
          assignee,
          actor,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('[Notifications] Failed to send ticket assigned notifications:', error);
        throw error;
      }

      console.log('[Notifications] Ticket assigned notifications sent successfully:', data);
    } catch (error) {
      console.error('[Notifications] Error in notifyTicketAssigned:', error);
    }
  },

  // Status Updated - notify requester and assignee
  async notifyTicketUpdated(ticket: TicketNotificationData, oldStatus: string, newStatus: string, actor: UserData, message?: string) {
    try {
      console.log(`[Notifications] Triggering ticket updated notifications: ${ticket.id} from ${oldStatus} to ${newStatus}`);

      const { data, error } = await supabase.functions.invoke('send-ticket-notifications', {
        body: {
          type: 'ticket_updated',
          ticket,
          oldStatus,
          newStatus,
          actor,
          message,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('[Notifications] Failed to send ticket updated notifications:', error);
        throw error;
      }

      console.log('[Notifications] Ticket updated notifications sent successfully:', data);
    } catch (error) {
      console.error('[Notifications] Error in notifyTicketUpdated:', error);
    }
  },

  // Ticket Closed - notify requester with resolution
  async notifyTicketClosed(ticket: TicketNotificationData, resolution: string, actor: UserData) {
    try {
      console.log(`[Notifications] Triggering ticket closed notifications: ${ticket.id}`);

      const { data, error } = await supabase.functions.invoke('send-ticket-notifications', {
        body: {
          type: 'ticket_closed',
          ticket,
          resolution,
          actor,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('[Notifications] Failed to send ticket closed notifications:', error);
        throw error;
      }

      console.log('[Notifications] Ticket closed notifications sent successfully:', data);
    } catch (error) {
      console.error('[Notifications] Error in notifyTicketClosed:', error);
    }
  },

  // Ticket Completed - notify requester with completion message
  async notifyTicketCompleted(ticket: TicketNotificationData, actor: UserData) {
    try {
      console.log(`[Notifications] Triggering ticket completed notifications: ${ticket.id}`);

      const { data, error } = await supabase.functions.invoke('send-ticket-notifications', {
        body: {
          type: 'ticket_completed',
          ticket,
          actor,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('[Notifications] Failed to send ticket completed notifications:', error);
        throw error;
      }

      console.log('[Notifications] Ticket completed notifications sent successfully:', data);
    } catch (error) {
      console.error('[Notifications] Error in notifyTicketCompleted:', error);
    }
  },

  // Task Assignment - notify assigned user(s)
  async notifyTaskAssigned(task: TaskNotificationData, assignees: UserData[], actor: UserData) {
    try {
      console.log(`[Notifications] Triggering task assigned notifications: ${task.id} to ${assignees.length} user(s)`);

      // Send notification to each assignee individually
      for (const assignee of assignees) {
        if (!assignee.email) {
          console.error('[Notifications] Missing assignee email for:', assignee);
          continue;
        }

        console.log(`[Notifications] Sending task assignment email to: ${assignee.email}`);

        const { data, error } = await supabase.functions.invoke('send-task-notifications', {
          body: {
            kind: 'task_assigned',
            to: assignee.email,
            task: {
              id: task.id,
              title: task.title,
              description: task.description,
              due_at: task.deadline,
              priority: task.priority
            },
            actor: {
              id: actor.id,
              email: actor.email,
              name: actor.name
            }
          }
        });

        if (error) {
          console.error(`[Notifications] Failed to send task assigned notification to ${assignee.email}:`, error);
        } else {
          console.log(`[Notifications] Task assigned notification sent successfully to ${assignee.email}:`, data);
        }
      }
    } catch (error) {
      console.error('[Notifications] Error in notifyTaskAssigned:', error);
    }
  },

  // Task Status Changed - notify assigned users
  async notifyTaskStatusChanged(task: TaskNotificationData, oldStatus: string, newStatus: string, actor: UserData, assignees: UserData[]) {
    try {
      console.log(`[Notifications] Triggering task status changed notifications: ${task.id} from ${oldStatus} to ${newStatus}`);

      const { data, error } = await supabase.functions.invoke('send-task-notifications', {
        body: {
          type: 'task_status_changed',
          task,
          oldStatus,
          newStatus,
          actor,
          assignees,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('[Notifications] Failed to send task status changed notifications:', error);
        throw error;
      }

      console.log('[Notifications] Task status changed notifications sent successfully:', data);
    } catch (error) {
      console.error('[Notifications] Error in notifyTaskStatusChanged:', error);
    }
  },

  // Inventory Template Completed - notify team managers and admins
  async notifyInventoryTemplateCompleted(count: InventoryNotificationData, completedBy: UserData) {
    try {
      console.log(`[Notifications] Triggering inventory template completed notifications: ${count.id}`);

      const { data, error } = await supabase.functions.invoke('send-inventory-notifications', {
        body: {
          type: 'template_completed',
          count,
          completedBy,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('[Notifications] Failed to send inventory template completed notifications:', error);
        throw error;
      }

      console.log('[Notifications] Inventory template completed notifications sent successfully:', data);
    } catch (error) {
      console.error('[Notifications] Error in notifyInventoryTemplateCompleted:', error);
    }
  },

  // Inventory Count Submitted - email notifications to team managers and admins
  async notifyInventorySubmitted(
    inventory: { id: string; team_name?: string; team_id?: string; items_total?: number; submitted_by_name?: string; location_name?: string; },
    recipients: Array<{ email?: string | null }>
  ) {
    try {
      const emails = (recipients ?? [])
        .map(r => r?.email?.trim()?.toLowerCase())
        .filter(Boolean);
      
      if (emails.length === 0) {
        console.warn("[notifyInventorySubmitted] No recipients with email", { recipients });
        return { data: { sent: 0, results: [] }, error: null };
      }

      console.log(`[Notifications] Sending inventory submission emails to ${emails.length} recipients: ${inventory.id}`);

      const { data, error } = await supabase.functions.invoke("send-inventory-notifications", {
        body: { kind: "inventory_count_submitted", recipients: emails, inventory, timestamp: new Date().toISOString() },
      });

      if (error) {
        console.error("[notifyInventorySubmitted] invoke failed", error);
      } else {
        console.log("[notifyInventorySubmitted] invoke ok", data);
      }

      return { data, error };
    } catch (error) {
      console.error('[Notifications] Error in notifyInventorySubmitted:', error);
      return { data: null, error };
    }
  },

  
  // Checklist Upcoming - notify team managers and assignees before execution window
  async notifyChecklistUpcoming(params: {
    checklist: { id: string; title: string; priority?: string };
    run: { id: string; startTime?: string; endTime?: string; windowLabel: string };
    team: { id?: string; name: string };
    org: { id: string; name: string };
    recipients: { id: string; email: string; name: string }[];
    actor: { id: string; name: string };
  }) {
    try {
      const { checklist, run, team, org, recipients, actor } = params;
      const dedupeKey = `${org.id}:${team.id || 'no-team'}:checklist_upcoming:${checklist.id}:${run.id}`;
      
      console.log(`[Notifications] Triggering checklist upcoming notifications: ${checklist.id}`, { dedupeKey });

      // 1. Insert in-app notification with dedupe check - check if exists first
      const existingNotification = await supabase
        .from('notifications')
        .select('id')
        .eq('organization_id', org.id)
        .eq('type', 'checklist_upcoming')
        .eq('metadata->>dedupe_key', dedupeKey)
        .maybeSingle();

      if (!existingNotification.data) {
        // Insert in-app notifications for each recipient
        const inAppNotifications = recipients.map(recipient => ({
          user_id: recipient.id,
          organization_id: org.id,
          type: 'checklist_upcoming',
          title: `Upcoming checklist "${checklist.title}" — ${team.name}`,
          content: `Scheduled for ${run.windowLabel}. Please prepare to complete the checklist.`,
          metadata: {
            dedupe_key: dedupeKey,
            checklistId: checklist.id,
            checklistTitle: checklist.title,
            teamId: team.id,
            teamName: team.name,
            runId: run.id,
            windowLabel: run.windowLabel,
            startTime: run.startTime,
            endTime: run.endTime
          },
          is_read: false
        }));

        const { error: insertError } = await supabase
          .from('notifications')
          .insert(inAppNotifications);

        if (insertError && insertError.code !== '23505') { // Ignore unique constraint violations
          console.error('[Notifications] Failed to insert in-app notifications:', insertError);
        }
      }

      // 2. Call edge function for emails
      const { data, error } = await supabase.functions.invoke('send-checklist-notifications', {
        body: {
          type: 'checklist_upcoming',
          recipients: recipients.map(r => r.email),
          orgName: org.name,
          teamName: team.name,
          checklist: {
            id: checklist.id,
            title: checklist.title,
            priority: checklist.priority
          },
          run: {
            id: run.id,
            startTime: run.startTime,
            endTime: run.endTime,
            windowLabel: run.windowLabel
          },
          actor: {
            id: actor.id,
            name: actor.name
          }
        }
      });

      if (error) {
        console.error('[Notifications] Failed to send checklist upcoming notifications:', error);
        throw error;
      }

      console.log(`CHECKLIST_NOTIFY { type: checklist_upcoming, checklistId: ${checklist.id}, runId: ${run.id}, sent: ${recipients.length}, total: ${recipients.length} }`);
    } catch (error) {
      console.error('[Notifications] Error in notifyChecklistUpcoming:', error);
      // Don't throw - notifications should not break the main flow
    }
  },

  // Checklist Completed - notify team managers and admins after submission
  async notifyChecklistCompleted(params: {
    checklist: { id: string; title: string; priority?: string };
    run: { id: string; startTime?: string; endTime?: string; windowLabel: string };
    team: { id?: string; name: string };
    org: { id: string; name: string };
    recipients: { id: string; email: string; name: string }[];
    actor: { id: string; name: string };
    metrics?: { percentComplete?: number; itemsTotal?: number; itemsDone?: number };
    completedBy?: string;
    notes?: string;
  }) {
    try {
      const { checklist, run, team, org, recipients, actor, metrics, completedBy, notes } = params;
      const dedupeKey = `${org.id}:${team.id || 'no-team'}:checklist_completed:${checklist.id}:${run.id}`;
      
      console.log(`[Notifications] Triggering checklist completed notifications: ${checklist.id}`, { dedupeKey });

      // 1. Insert in-app notification with dedupe check - check if exists first
      const existingNotification = await supabase
        .from('notifications')
        .select('id')
        .eq('organization_id', org.id)
        .eq('type', 'checklist_completed')
        .eq('metadata->>dedupe_key', dedupeKey)
        .maybeSingle();

      if (!existingNotification.data) {
        // Insert in-app notifications for each recipient
        const inAppNotifications = recipients.map(recipient => ({
          user_id: recipient.id,
          organization_id: org.id,
          type: 'checklist_completed',
          title: `Completed checklist "${checklist.title}" — ${team.name}`,
          content: `${metrics?.percentComplete || 0}% complete (${metrics?.itemsDone || 0}/${metrics?.itemsTotal || 0} items)${completedBy ? ` by ${completedBy}` : ''}`,
          metadata: {
            dedupe_key: dedupeKey,
            checklistId: checklist.id,
            checklistTitle: checklist.title,
            teamId: team.id,
            teamName: team.name,
            runId: run.id,
            windowLabel: run.windowLabel,
            percentComplete: metrics?.percentComplete,
            itemsTotal: metrics?.itemsTotal,
            itemsDone: metrics?.itemsDone,
            completedBy,
            notes
          },
          is_read: false
        }));

        const { error: insertError } = await supabase
          .from('notifications')
          .insert(inAppNotifications);

        if (insertError && insertError.code !== '23505') { // Ignore unique constraint violations
          console.error('[Notifications] Failed to insert in-app notifications:', insertError);
        }
      }

      // 2. Call edge function for emails
      const { data, error } = await supabase.functions.invoke('send-checklist-notifications', {
        body: {
          type: 'checklist_completed',
          recipients: recipients.map(r => r.email),
          orgName: org.name,
          teamName: team.name,
          checklist: {
            id: checklist.id,
            title: checklist.title,
            priority: checklist.priority
          },
          run: {
            id: run.id,
            startTime: run.startTime,
            endTime: run.endTime,
            windowLabel: run.windowLabel
          },
          actor: {
            id: actor.id,
            name: actor.name
          },
          metrics,
          completedBy,
          notes
        }
      });

      if (error) {
        console.error('[Notifications] Failed to send checklist completed notifications:', error);
        throw error;
      }

      console.log(`CHECKLIST_NOTIFY { type: checklist_completed, checklistId: ${checklist.id}, runId: ${run.id}, sent: ${recipients.length}, total: ${recipients.length} }`);
    } catch (error) {
      console.error('[Notifications] Error in notifyChecklistCompleted:', error);
      // Don't throw - notifications should not break the main flow
    }
  },
  
  // ========================= SCHEDULE NOTIFICATIONS =========================

  // Shift Assigned - notify assigned user + team managers + org admins
  async notifyShiftAssigned({ 
    orgId, teamId, shift, actor 
  }: {
    orgId: string;
    teamId?: string | null;
    shift: { id: string; title: string; starts_at: string; ends_at: string; location?: string; notes?: string; assigned_user_id?: string; team_name?: string };
    actor: { id: string; name: string; email: string };
  }) {
    try {
      const dedupeKey = `${orgId}:${teamId || 'no-team'}:schedule:schedule_shift_assigned:${shift.id}`;
      console.log(`[SCHED_NOTIFY] Triggering shift assigned notifications: ${shift.id}`, { dedupeKey });

      // Get recipients for in-app notifications
      const recipients: Array<{ id: string; name: string; email: string }> = [];
      
      if (shift.assigned_user_id) {
        const { data: assignedUser } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', shift.assigned_user_id)
          .single();
        
        if (assignedUser) recipients.push(assignedUser);
      }

      // Create in-app notifications
      if (recipients.length > 0) {
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('organization_id', orgId)
          .eq('type', 'schedule_shift_assigned')
          .eq('metadata->>dedupe_key', dedupeKey)
          .maybeSingle();

        if (!existingNotification) {
          const inAppNotifications = recipients.map(recipient => ({
            user_id: recipient.id,
            organization_id: orgId,
            type: 'schedule_shift_assigned',
            title: `New Shift Assignment - ${shift.title}`,
            content: `You've been assigned a new shift: ${shift.title} on ${new Date(shift.starts_at).toLocaleDateString()}`,
            metadata: {
              dedupe_key: dedupeKey,
              teamId,
              entityId: shift.id,
              timestamp: new Date().toISOString()
            },
            is_read: false
          }));

          await supabase.from('notifications').insert(inAppNotifications);
        }
      }

      // Invoke edge function for emails
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.functions.invoke('send-schedule-notifications', {
        body: {
          type: 'schedule_shift_assigned',
          orgId,
          teamId,
          shift,
          actor,
          timestamp: new Date().toISOString(),
          dedupeKey
        },
        headers: { 
          Authorization: `Bearer ${session?.access_token ?? ''}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('[SCHED_NOTIFY] Error in notifyShiftAssigned:', error);
      // Don't throw - notifications should not break the main flow
    }
  },

  // Shift Updated - notify assigned user + team managers + org admins
  async notifyShiftUpdated({ 
    orgId, teamId, shift, actor 
  }: {
    orgId: string;
    teamId?: string | null;
    shift: { id: string; title: string; starts_at: string; ends_at: string; location?: string; notes?: string; assigned_user_id?: string; team_name?: string };
    actor: { id: string; name: string; email: string };
  }) {
    try {
      const dedupeKey = `${orgId}:${teamId || 'no-team'}:schedule:schedule_shift_updated:${shift.id}`;
      console.log(`[SCHED_NOTIFY] Triggering shift updated notifications: ${shift.id}`, { dedupeKey });

      // Invoke edge function for emails
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.functions.invoke('send-schedule-notifications', {
        body: {
          type: 'schedule_shift_updated',
          orgId,
          teamId,
          shift,
          actor,
          timestamp: new Date().toISOString(),
          dedupeKey
        },
        headers: { 
          Authorization: `Bearer ${session?.access_token ?? ''}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('[SCHED_NOTIFY] Error in notifyShiftUpdated:', error);
      // Don't throw - notifications should not break the main flow
    }
  },

  // Time Entry Opened (Clock In) - notify managers
  async notifyTimeEntryOpened({ 
    orgId, teamId, entry, actor 
  }: {
    orgId: string;
    teamId?: string | null;
    entry: { id: string; user_id: string; user_name?: string; clock_in: string; notes?: string; team_name?: string; shift_id?: string };
    actor: { id: string; name: string; email: string };
  }) {
    try {
      const dedupeKey = `${orgId}:${teamId || 'no-team'}:schedule:schedule_time_entry_opened:${entry.id}`;
      console.log(`[SCHED_NOTIFY] Triggering time entry opened notifications: ${entry.id}`, { dedupeKey });

      // Invoke edge function for emails
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.functions.invoke('send-schedule-notifications', {
        body: {
          type: 'schedule_time_entry_opened',
          orgId,
          teamId,
          entry,
          actor,
          timestamp: new Date().toISOString(),
          dedupeKey
        },
        headers: { 
          Authorization: `Bearer ${session?.access_token ?? ''}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('[SCHED_NOTIFY] Error in notifyTimeEntryOpened:', error);
      // Don't throw - notifications should not break the main flow
    }
  },

  // Time Entry Closed (Clock Out) - notify managers
  async notifyTimeEntryClosed({ 
    orgId, teamId, entry, actor 
  }: {
    orgId: string;
    teamId?: string | null;
    entry: { id: string; user_id: string; user_name?: string; clock_in: string; clock_out?: string; duration_minutes?: number; notes?: string; team_name?: string; shift_id?: string };
    actor: { id: string; name: string; email: string };
  }) {
    try {
      const dedupeKey = `${orgId}:${teamId || 'no-team'}:schedule:schedule_time_entry_closed:${entry.id}`;
      console.log(`[SCHED_NOTIFY] Triggering time entry closed notifications: ${entry.id}`, { dedupeKey });

      // Invoke edge function for emails
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.functions.invoke('send-schedule-notifications', {
        body: {
          type: 'schedule_time_entry_closed',
          orgId,
          teamId,
          entry,
          actor,
          timestamp: new Date().toISOString(),
          dedupeKey
        },
        headers: { 
          Authorization: `Bearer ${session?.access_token ?? ''}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('[SCHED_NOTIFY] Error in notifyTimeEntryClosed:', error);
      // Don't throw - notifications should not break the main flow
    }
  },
  
  // Simple success/error notifications for UI feedback
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.info(message),
  warning: (message: string) => toast.warning(message)
  // Add approval notification functions
  notifyTimeEntryNeedsApproval: async (eventData: {
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
    actor: { id: string; name: string; email: string };
  }) => {
    await supabase.functions.invoke('send-schedule-notifications', {
      body: {
        type: 'time_entry_needs_approval',
        orgId: eventData.orgId,
        teamId: eventData.teamId,
        entry: eventData.entry,
        actor: eventData.actor,
        timestamp: new Date().toISOString(),
        dedupeKey: `time_entry_needs_approval_${eventData.entry.id}_${Date.now()}`
      }
    });
  },

  notifyTimeEntryApproved: async (eventData: {
    orgId: string;
    teamId?: string | null;
    entry: {
      id: string;
      user_id: string;
      user_name: string;
      duration_minutes: number;
      work_date: string;
    };
    approver: { id: string; name: string; email: string };
    approval_notes?: string;
  }) => {
    await supabase.functions.invoke('send-schedule-notifications', {
      body: {
        type: 'time_entry_approved',
        orgId: eventData.orgId,
        teamId: eventData.teamId,
        entry: eventData.entry,
        approver: eventData.approver,
        approval_notes: eventData.approval_notes,
        timestamp: new Date().toISOString(),
        dedupeKey: `time_entry_approved_${eventData.entry.id}_${Date.now()}`
      }
    });
  },

  notifyTimeEntryRejected: async (eventData: {
    orgId: string;
    teamId?: string | null;
    entry: {
      id: string;
      user_id: string;
      user_name: string;
      duration_minutes: number;
      work_date: string;
    };
    approver: { id: string; name: string; email: string };
    rejection_reason: string;
  }) => {
    await supabase.functions.invoke('send-schedule-notifications', {
      body: {
        type: 'time_entry_rejected',
        orgId: eventData.orgId,
        teamId: eventData.teamId,
        entry: eventData.entry,
        approver: eventData.approver,
        rejection_reason: eventData.rejection_reason,
        timestamp: new Date().toISOString(),
        dedupeKey: `time_entry_rejected_${eventData.entry.id}_${Date.now()}`
      }
    });
  }
};