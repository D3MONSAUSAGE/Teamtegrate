import { supabase } from '@/integrations/supabase/client';
import { getChecklistRecipients } from '@/lib/notifications/recipients';
import { formatWindow } from '@/utils/windowFormatter';

/**
 * Bridge function to send checklist completion notifications for the old system
 */
export async function notifyChecklistCompleted(executionId: string): Promise<void> {
  try {
    // 1. Fetch execution details with related data
    const { data: execution, error: execError } = await supabase
      .from('checklist_executions')
      .select(`
        *,
        checklist:checklists(*),
        assigned_user:users!assigned_to_user_id(id, name, email)
      `)
      .eq('id', executionId)
      .single();

    if (execError || !execution) {
      console.error('Failed to fetch execution details:', execError);
      return;
    }

    // 2. Fetch organization details separately
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, timezone')
      .eq('id', execution.organization_id)
      .single();

    // 3. Fetch execution items for metrics
    const { data: items, error: itemsError } = await supabase
      .from('checklist_execution_items')
      .select('id, is_completed')
      .eq('execution_id', executionId);

    if (itemsError) {
      console.error('Failed to fetch execution items:', itemsError);
      return;
    }

    // 4. Calculate metrics
    const itemsTotal = items?.length ?? 0;
    const itemsDone = (items ?? []).filter(item => item.is_completed).length;
    const percentComplete = itemsTotal > 0 ? Math.round((itemsDone / itemsTotal) * 100) : 0;

    // 5. Get recipients using the same pattern as inventory/requests
    const assignmentType = execution.checklist?.assignment_type === 'role_based' ? 'team' : 
                          (execution.checklist?.assignment_type || 'individual') as 'team' | 'individual';
    
    const recipients = await getChecklistRecipients({
      orgId: execution.organization_id,
      teamId: undefined, // Old system doesn't have team_id on execution
      assignmentType,
      assigneeIds: [execution.assigned_to_user_id]
    });

    if (recipients.length === 0) {
      console.warn('No recipients found for checklist completion notification', { executionId });
      return;
    }

    // 6. Format execution window
    const tz = org?.timezone || 'UTC';
    const windowLabel = formatWindow(
      execution.checklist?.execution_window_start, 
      execution.checklist?.execution_window_end, 
      tz
    );

    // 7. Build idempotency key
    const dedupeKey = `${execution.organization_id}:no-team:checklist_completed:${execution.checklist_id}:${executionId}`;

    // 8. Create in-app notification
    await supabase
      .from('notifications')
      .insert({
        user_id: execution.assigned_to_user_id,
        organization_id: execution.organization_id,
        title: 'Checklist Completed',
        content: `Checklist "${execution.checklist?.name || 'Unknown'}" has been completed`,
        type: 'checklist_completed',
        metadata: {
          checklist_id: execution.checklist_id,
          execution_id: executionId,
          dedupe_key: dedupeKey
        }
      });

    // 9. Send email notification via edge function
    const emailPayload = {
      kind: 'checklist_completed',
      recipients: recipients.map(r => r.email),
      instance: {
        id: executionId,
        display_code: `CHK-${execution.execution_date.replace(/-/g, '')}-${executionId.substring(0, 6)}`,
        name: execution.checklist?.name || 'Unknown Checklist',
        team_name: 'Team',
        date: execution.execution_date,
        window_label: windowLabel,
        metrics: {
          percent_complete: percentComplete,
          items_total: itemsTotal,
          items_done: itemsDone
        }
      },
      actor: {
        name: execution.assigned_user?.name || 'User',
        email: execution.assigned_user?.email || 'user@example.com'
      },
      org: {
        name: org?.name || 'Organization'
      },
      notes: execution.notes,
      dedupe_key: dedupeKey
    };

    // 10. Send via edge function
    const { error: functionError } = await supabase.functions.invoke('send-checklist-notifications', {
      body: emailPayload
    });

    if (functionError) {
      console.error('Failed to send checklist completion email:', functionError);
    } else {
      console.log('CHECKLIST_NOTIFY', {
        type: 'checklist_completed',
        checklistId: execution.checklist_id,
        runId: executionId,
        sent: recipients.length,
        total: recipients.length,
        dedupeKey
      });
    }

  } catch (error) {
    console.error('Error in checklist completion notification bridge:', error);
  }
}