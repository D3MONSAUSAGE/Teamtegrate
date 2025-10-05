import { supabase } from '@/integrations/supabase/client';

interface NotificationPayload {
  kind: 'checklist_submitted' | 'checklist_verified' | 'checklist_rejected';
  recipients: string[];
  instance: {
    id: string;
    display_code?: string;
    name: string;
    team_name?: string;
    date: string;
  };
  actor: {
    name: string;
    email: string;
  };
  org: {
    name: string;
  };
}

class NotificationService {
  /**
   * Send notification when checklist is submitted for verification
   */
  async sendSubmitted(instanceId: string): Promise<void> {
    const instance = await this.getInstanceDetails(instanceId);
    const recipients = await this.getManagerRecipients(instance.org_id, instance.team_id);
    
    if (recipients.length === 0) {
      console.warn('No managers found to notify for checklist submission', { instanceId });
      return;
    }
    
    const payload: NotificationPayload = {
      kind: 'checklist_submitted',
      recipients: recipients.map(r => r.email),
      instance: {
        id: instance.id,
        display_code: this.generateDisplayCode(instance),
        name: instance.template?.name || 'Unknown Checklist',
        team_name: 'Team',
        date: instance.date
      },
      actor: {
        name: 'User',
        email: 'user@example.com'
      },
      org: {
        name: 'Organization'
      }
    };
    
    await this.sendNotification(payload);
    
    // Send push notification to managers
    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          type: 'checklist_submitted',
          organization_id: instance.org_id,
          title: 'Checklist Submitted for Verification',
          body: `${this.generateDisplayCode(instance)} - ${instance.template?.name || 'Unknown Checklist'} needs verification`,
          data: {
            instance_id: instanceId,
            route: '/dashboard/checklists'
          }
        }
      });
    } catch (pushError) {
      console.warn('Failed to send push notification:', pushError);
    }
  }

  /**
   * Send notification when checklist is verified
   */
  async sendVerified(instanceId: string): Promise<void> {
    const instance = await this.getInstanceDetails(instanceId);
    
    const payload: NotificationPayload = {
      kind: 'checklist_verified',
      recipients: ['user@example.com'],
      instance: {
        id: instance.id,
        display_code: this.generateDisplayCode(instance),
        name: instance.template?.name || 'Unknown Checklist',
        team_name: 'Team',
        date: instance.date
      },
      actor: {
        name: 'Manager',
        email: 'manager@example.com'
      },
      org: {
        name: 'Organization'
      }
    };
    
    await this.sendNotification(payload);
    
    // Send push notification to employee
    if (instance.executed_by) {
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            type: 'checklist_verified',
            organization_id: instance.org_id,
            user_ids: [instance.executed_by],
            title: 'Checklist Verified',
            body: `${this.generateDisplayCode(instance)} - ${instance.template?.name || 'Unknown Checklist'} has been verified`,
            data: {
              instance_id: instanceId,
              route: '/dashboard/checklists'
            }
          }
        });
      } catch (pushError) {
        console.warn('Failed to send push notification:', pushError);
      }
    }
  }

  /**
   * Send notification when checklist is rejected
   */
  async sendRejected(instanceId: string): Promise<void> {
    const instance = await this.getInstanceDetails(instanceId);
    
    const payload: NotificationPayload = {
      kind: 'checklist_rejected',
      recipients: ['user@example.com'],
      instance: {
        id: instance.id,
        display_code: this.generateDisplayCode(instance),
        name: instance.template?.name || 'Unknown Checklist',
        team_name: 'Team',
        date: instance.date
      },
      actor: {
        name: 'Manager',
        email: 'manager@example.com'
      },
      org: {
        name: 'Organization'
      }
    };
    
    await this.sendNotification(payload);
    
    // Send push notification to employee
    if (instance.executed_by) {
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            type: 'checklist_rejected',
            organization_id: instance.org_id,
            user_ids: [instance.executed_by],
            title: 'Checklist Rejected',
            body: `${this.generateDisplayCode(instance)} - ${instance.template?.name || 'Unknown Checklist'} needs revision`,
            data: {
              instance_id: instanceId,
              route: '/dashboard/checklists'
            }
          }
        });
      } catch (pushError) {
        console.warn('Failed to send push notification:', pushError);
      }
    }
  }

  /**
   * Get checklist instance details with related data
   */
  private async getInstanceDetails(instanceId: string) {
    const { data, error } = await supabase
      .from('checklist_instances_v2')
      .select(`
        *,
        template:checklist_templates_v2(name)
      `)
      .eq('id', instanceId)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch instance details: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Get manager recipients for notifications
   */
  private async getManagerRecipients(orgId: string, teamId?: string): Promise<Array<{ name: string; email: string }>> {
    // Get team managers if team-specific
    let teamManagers: any[] = [];
    if (teamId) {
      const { data } = await supabase
        .from('teams')
        .select(`
          manager_id,
          manager:users!manager_id(name, email)
        `)
        .eq('id', teamId)
        .single();
      
      if (data?.manager) {
        teamManagers.push(data.manager);
      }
    }
    
    // Get organizational managers and admins
    const { data: orgManagers, error } = await supabase
      .from('users')
      .select('name, email')
      .eq('organization_id', orgId)
      .in('role', ['manager', 'admin', 'superadmin']);
    
    if (error) {
      console.error('Failed to fetch organizational managers:', error);
    }
    
    // Combine and deduplicate
    const allRecipients = [...teamManagers, ...(orgManagers || [])];
    const uniqueRecipients = Array.from(
      new Map(allRecipients.map(r => [r.email, r])).values()
    );
    
    return uniqueRecipients.filter(r => r.email);
  }

  /**
   * Send notification via edge function
   */
  private async sendNotification(payload: NotificationPayload): Promise<void> {
    // Check for duplicate sends
    const eventId = `${payload.kind}:${payload.instance.id}`;
    
    const { data: existingOutbox } = await supabase
      .from('email_outbox')
      .select('event_id')
      .eq('event_id', eventId)
      .single();
    
    if (existingOutbox) {
      console.log('Notification already sent, skipping', { eventId });
      return;
    }
    
    // Record in outbox to prevent duplicates
    const { error: outboxError } = await supabase
      .from('email_outbox')
      .insert({
        event_id: eventId,
        payload: payload as any
      });
    
    if (outboxError && outboxError.code !== '23505') { // Ignore unique constraint violations
      console.error('Failed to record email in outbox:', outboxError);
    }
    
    // Send via edge function
    const { data, error } = await supabase.functions.invoke('send-checklist-notifications', {
      body: payload
    });
    
    if (error) {
      throw new Error(`Failed to send notification: ${error.message}`);
    }
    
    console.log('Notification sent successfully', { 
      kind: payload.kind, 
      instanceId: payload.instance.id,
      recipientsCount: payload.recipients.length,
      result: data 
    });
  }

  /**
   * Generate human-readable display code
   */
  private generateDisplayCode(instance: any): string {
    const date = instance.date.replace(/-/g, '');
    const shortId = instance.id.substring(0, 6).toUpperCase();
    return `CHK-${date}-${shortId}`;
  }
}

export const notificationService = new NotificationService();