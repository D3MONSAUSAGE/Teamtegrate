import { supabase } from '@/integrations/supabase/client';
import { notificationService } from './notificationService';
import { getChecklistRecipients } from '@/lib/notifications/recipients';
import { notifications } from '@/lib/notifications';

export interface ChecklistInstance {
  id: string;
  template_id: string;
  org_id: string;
  team_id?: string;
  date: string;
  status: 'pending' | 'submitted' | 'verified' | 'rejected' | 'expired';
  scheduled_start?: string;
  scheduled_end?: string;
  executed_by?: string;
  executed_at?: string;
  verified_by?: string;
  verified_at?: string;
  manager_note?: string;
  reject_reason?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  template?: {
    name: string;
    description?: string;
    priority: string;
    require_verification: boolean;
    start_time?: string;
    end_time?: string;
  };
  entries?: ChecklistItemEntry[];
}

export interface ChecklistItemEntry {
  id: string;
  instance_id: string;
  template_item_id: string;
  position: number;
  value: any;
  photo_urls: string[];
  note?: string;
  executed_status: 'unchecked' | 'pass' | 'fail' | 'na';
  verified_status: 'unchecked' | 'pass' | 'fail' | 'na';
  
  // Joined data
  template_item?: {
    label: string;
    instructions?: string;
    requires_photo: boolean;
    requires_note: boolean;
  };
}

export interface TeamChecklistSummary {
  org_id: string;
  team_id?: string;
  date: string;
  total_instances: number;
  executed_instances: number;
  verified_instances: number;
  execution_pct: number;
  verification_pct: number;
}

export interface ExecuteChecklistParams {
  instanceId: string;
  items: Array<{
    entryId: string;
    executed_status: 'pass' | 'fail' | 'na';
    value?: any;
    note?: string;
    photo_urls?: string[];
  }>;
  submit: boolean;
  actor: {
    id: string;
    name: string;
    email: string;
  };
}

export interface VerifyChecklistParams {
  instanceId: string;
  items: Array<{
    entryId: string;
    verified_status: 'pass' | 'fail' | 'na';
  }>;
  decision: 'approve' | 'reject';
  managerNote?: string;
  actor: {
    id: string;
    name: string;
    email: string;
  };
}

class ChecklistInstanceService {
  async getTodaySummary(orgId: string, teamId?: string): Promise<TeamChecklistSummary[]> {
    const today = new Date().toISOString().split('T')[0];
    
    let query = supabase
      .from('v_team_checklist_scores')
      .select('*')
      .eq('org_id', orgId)
      .eq('date', today);
    
    if (teamId) {
      query = query.eq('team_id', teamId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch checklist summary: ${error.message}`);
    }
    
    return data || [];
  }

  async listForToday(orgId: string, teamId?: string): Promise<ChecklistInstance[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('checklist_instances_v2')
      .select(`
        *,
        template:checklist_templates_v2(name, description, priority, require_verification, start_time, end_time)
      `)
      .eq('org_id', orgId)
      .eq('date', today)
      .order('created_at', { ascending: false });
    
    return (data as any) || [];
  }

  async getById(instanceId: string): Promise<ChecklistInstance | null> {
    const { data, error } = await supabase
      .from('checklist_instances_v2')
      .select(`
        *,
        template:checklist_templates_v2(name, description, priority, require_verification, start_time, end_time)
      `)
      .eq('id', instanceId)
      .single();
    
    if (error?.code === 'PGRST116') {
      return null;
    }
    
    return data as any;
  }

  async execute(params: ExecuteChecklistParams): Promise<ChecklistInstance> {
    const instance = await this.getById(params.instanceId);
    if (!instance) {
      throw new Error('Checklist instance not found');
    }

    // Simple update without transactions for now
    for (const item of params.items) {
      await supabase
        .from('checklist_item_entries_v2')
        .update({
          executed_status: item.executed_status,
          value: item.value || {},
          note: item.note,
          photo_urls: item.photo_urls || []
        })
        .eq('id', item.entryId);
    }

    if (params.submit) {
      await supabase
        .from('checklist_instances_v2')
        .update({
          status: 'submitted',
          executed_by: params.actor.id,
          executed_at: new Date().toISOString()
        })
        .eq('id', params.instanceId);

      await notificationService.sendSubmitted(params.instanceId);
      
      // Fetch template/team/org (lightweight)
      const [{ data: template }, { data: team }, { data: org }] = await Promise.all([
        supabase.from("checklist_templates_v2").select("id,name,priority,assignment_type").eq("id", instance.template_id).maybeSingle(),
        supabase.from("teams").select("id,name").eq("id", instance.team_id).maybeSingle(),
        supabase.from("organizations").select("id,name,timezone").eq("id", instance.org_id).maybeSingle()
      ]);

      // Actual metrics from entries
      const { data: entries } = await supabase
        .from("checklist_item_entries_v2")
        .select("id,executed_status")
        .eq("instance_id", instance.id);

      const itemsTotal = entries?.length ?? 0;
      const itemsDone = (entries ?? []).filter(e => e.executed_status && e.executed_status !== "unchecked").length;
      const percentComplete = itemsTotal ? Math.round((itemsDone / itemsTotal) * 100) : 0;

      // Window label (reuse existing formatter)
      const formatTime = (time: string) => {
        try {
          const timeStr = time.includes('T') ? time.split('T')[1]?.substring(0, 5) : time;
          if (!timeStr) return '';
          const [hour, minute] = timeStr.split(':').map(Number);
          const date = new Date();
          date.setHours(hour, minute);
          return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        } catch { return time; }
      };
      
      const windowLabel = instance.scheduled_start && instance.scheduled_end 
        ? `${formatTime(instance.scheduled_start)}–${formatTime(instance.scheduled_end)}`
        : 'Today';

      // Recipients (team managers + admins, + assignees if assignment_type === 'individual')
      const recipients = await getChecklistRecipients({
        orgId: instance.org_id,
        teamId: instance.team_id,
        assignmentType: template?.assignment_type === 'individual' ? 'individual' : 'team',
        assigneeIds: [] // include if you support individual assignees
      });
      
      if (recipients.length > 0) {
        await notifications.notifyChecklistCompleted({
          checklist: { id: instance.template_id, title: template?.name ?? "Checklist", priority: template?.priority ?? "medium" },
          run: { id: instance.id, windowLabel, startTime: instance.scheduled_start, endTime: instance.scheduled_end },
          team: { id: instance.team_id, name: team?.name ?? "Team" },
          org: { id: instance.org_id, name: org?.name ?? "Organization" },
          recipients,
          actor: { id: params.actor.id, name: params.actor.name },
          metrics: { percentComplete, itemsTotal, itemsDone },
          completedBy: params.actor.name
        });
      }
    }

    return instance;
  }

  async verify(params: VerifyChecklistParams): Promise<ChecklistInstance> {
    const instance = await this.getById(params.instanceId);
    if (!instance) {
      throw new Error('Checklist instance not found');
    }

    // Update verification status
    for (const item of params.items) {
      await supabase
        .from('checklist_item_entries_v2')
        .update({ verified_status: item.verified_status })
        .eq('id', item.entryId);
    }

    // Update instance
    const status = params.decision === 'approve' ? 'verified' : 'rejected';
    await supabase
      .from('checklist_instances_v2')
      .update({
        status,
        verified_by: params.actor.id,
        verified_at: new Date().toISOString(),
        manager_note: params.managerNote
      })
      .eq('id', params.instanceId);

    if (params.decision === 'approve') {
      await notificationService.sendVerified(params.instanceId);
    } else {
      await notificationService.sendRejected(params.instanceId);
    }

    return instance;
  }

  calculateProgress(instance: ChecklistInstance): { executed: number; verified: number } {
    if (!instance.entries || instance.entries.length === 0) {
      return { executed: 0, verified: 0 };
    }
    
    const totalItems = instance.entries.length;
    const executedItems = instance.entries.filter(entry => entry.executed_status !== 'unchecked').length;
    const verifiedItems = instance.entries.filter(entry => entry.verified_status !== 'unchecked').length;
    
    return {
      executed: Math.round((executedItems / totalItems) * 100),
      verified: Math.round((verifiedItems / totalItems) * 100)
    };
  }

  isWithinTimeWindow(instance: ChecklistInstance): { 
    isWithin: boolean; 
    isExpired: boolean; 
    timeUntilStart?: number; 
    timeUntilEnd?: number;
  } {
    const now = new Date();
    
    if (!instance.scheduled_start && !instance.scheduled_end) {
      return { isWithin: true, isExpired: false };
    }
    
    const startTime = instance.scheduled_start ? new Date(instance.scheduled_start) : null;
    const endTime = instance.scheduled_end ? new Date(instance.scheduled_end) : null;
    
    if (startTime && now < startTime) {
      const timeUntilStart = Math.ceil((startTime.getTime() - now.getTime()) / (1000 * 60));
      return { isWithin: false, isExpired: false, timeUntilStart };
    }
    
    if (endTime && now > endTime) {
      return { isWithin: false, isExpired: true };
    }
    
    if (endTime) {
      const timeUntilEnd = Math.ceil((endTime.getTime() - now.getTime()) / (1000 * 60));
      return { isWithin: true, isExpired: false, timeUntilEnd };
    }
    
    return { isWithin: true, isExpired: false };
  }
}

export const checklistInstanceService = new ChecklistInstanceService();