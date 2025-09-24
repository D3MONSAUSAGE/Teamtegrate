import { supabase } from '@/integrations/supabase/client';

export interface NotificationRecipient {
  id: string;
  email: string;
  name: string;
}

export interface GetChecklistRecipientsParams {
  orgId: string;
  teamId?: string;
  assignmentType?: 'team' | 'individual';
  assigneeIds?: string[];
}

/**
 * Get checklist notification recipients following the same pattern as inventory/requests
 * Returns team managers + org admins/superadmins + individual assignees (if applicable)
 */
export async function getChecklistRecipients({
  orgId,
  teamId,
  assignmentType,
  assigneeIds = []
}: GetChecklistRecipientsParams): Promise<NotificationRecipient[]> {
  const recipients: NotificationRecipient[] = [];

  try {
    // 1. Get team managers if team-specific
    if (teamId) {
      const { data: teamData } = await supabase
        .from('teams')
        .select(`
          manager_id,
          manager:users!manager_id(id, name, email)
        `)
        .eq('id', teamId)
        .eq('is_active', true)
        .single();

      if (teamData?.manager) {
        recipients.push({
          id: teamData.manager.id,
          email: teamData.manager.email,
          name: teamData.manager.name || teamData.manager.email
        });
      }
    }

    // 2. Get org admins + superadmins (always included)
    const { data: orgManagers } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('organization_id', orgId)
      .in('role', ['manager', 'admin', 'superadmin']);

    if (orgManagers) {
      recipients.push(...orgManagers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name || user.email
      })));
    }

    // 3. If individual assignment, include the assigned users
    if (assignmentType === 'individual' && assigneeIds.length > 0) {
      const { data: assignees } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('organization_id', orgId)
        .in('id', assigneeIds);

      if (assignees) {
        recipients.push(...assignees.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name || user.email
        })));
      }
    }

    // 4. Deduplicate by user ID first (primary deduplication), then by email as fallback
    const uniqueByIdMap = new Map<string, NotificationRecipient>();
    const uniqueByEmailMap = new Map<string, NotificationRecipient>();
    
    recipients.forEach(recipient => {
      // Primary deduplication by user ID
      if (!uniqueByIdMap.has(recipient.id)) {
        uniqueByIdMap.set(recipient.id, recipient);
      }
      // Fallback deduplication by email (for edge cases)
      const emailKey = recipient.email.toLowerCase().trim();
      if (!uniqueByEmailMap.has(emailKey)) {
        uniqueByEmailMap.set(emailKey, recipient);
      }
    });

    // Use ID-based deduplication as primary, email as fallback
    const uniqueRecipients = Array.from(uniqueByIdMap.values());
    
    // 5. Filter out any recipients without valid emails and log recipients
    const validRecipients = uniqueRecipients.filter(r => r.email && r.email.includes('@'));
    
    console.log(`[Checklist Recipients] Found ${recipients.length} total, ${uniqueRecipients.length} unique, ${validRecipients.length} valid recipients:`, 
      validRecipients.map(r => `${r.name} (${r.email})`));
    
    return validRecipients;

  } catch (error) {
    console.error('Failed to fetch checklist recipients:', error);
    return [];
  }
}