import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScheduleNotificationPayload {
  type: 'schedule_shift_assigned' | 'schedule_shift_updated' | 'schedule_shift_canceled' |
        'schedule_time_entry_opened' | 'schedule_time_entry_closed' | 
        'time_entry_approved' | 'time_entry_rejected' | 'time_entry_needs_approval';
  orgId: string;
  teamId?: string | null;
  shift?: any;
  entry?: any;
  actor: { id: string; name: string; email: string };
  timestamp: string;
  dedupeKey: string;
  // For approval events
  approver?: { id: string; name: string; email: string };
  approval_notes?: string;
  rejection_reason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    const payload: ScheduleNotificationPayload = await req.json();
    console.log(`[Schedule Notifications] Processing ${payload.type} for org ${payload.orgId}`);

    // Get recipients: assigned user + team managers + org admins
    const recipients: Array<{ id: string; email: string; name: string }> = [];

    // Add assigned user for shift events
    if (payload.shift?.assigned_user_id) {
      const { data: assignedUser } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('id', payload.shift.assigned_user_id)
        .single();
      
      if (assignedUser?.email) {
        recipients.push(assignedUser);
      }
    }

    // Add entry user for time entry events
    if (payload.entry?.user_id) {
      const { data: entryUser } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('id', payload.entry.user_id)
        .single();
      
      if (entryUser?.email) {
        recipients.push(entryUser);
      }
    }

    // Add team managers if teamId is provided
    if (payload.teamId) {
      const { data: teamManagers } = await supabase
        .from('teams')
        .select(`
          users!manager_id (
            id, email, name
          )
        `)
        .eq('id', payload.teamId)
        .eq('is_active', true);

      teamManagers?.forEach(team => {
        if (team.users?.email) {
          recipients.push(team.users);
        }
      });
    }

    // Add org admins/superadmins
    const { data: admins } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('organization_id', payload.orgId)
      .in('role', ['admin', 'superadmin']);

    admins?.forEach(admin => {
      if (admin.email) {
        recipients.push(admin);
      }
    });

    // Dedupe recipients by email
    const uniqueRecipients = recipients.filter((recipient, index, arr) => 
      arr.findIndex(r => r.email === recipient.email) === index
    );

    if (uniqueRecipients.length === 0) {
      console.log('[Schedule Notifications] No recipients found');
      return new Response(JSON.stringify({ sent: 0, total: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Schedule Notifications] Sending to ${uniqueRecipients.length} recipients`);

    // Generate email content based on notification type
    const { subject, content } = generateEmailContent(payload);

    // Send emails with throttling (600ms between sends)
    let sent = 0;
    for (const recipient of uniqueRecipients) {
      try {
        await new Promise(resolve => setTimeout(resolve, 600)); // Throttle to avoid rate limits

        const personalizedContent = content.replace('{{recipient_name}}', recipient.name || recipient.email);
        
        const { error: emailError } = await resend.emails.send({
          from: "Teamtegrate <notifications@teamtegrate.com>",
          to: [recipient.email],
          subject,
          html: personalizedContent,
        });

        if (emailError) {
          console.error(`[Schedule Notifications] Failed to send email to ${recipient.email}:`, emailError);
        } else {
          sent++;
        }
      } catch (error) {
        console.error(`[Schedule Notifications] Error sending email to ${recipient.email}:`, error);
      }
    }

    console.log(`SCHED_EMAIL_RESULTS { type: ${payload.type}, sent: ${sent}, total: ${uniqueRecipients.length} }`);

    return new Response(JSON.stringify({ sent, total: uniqueRecipients.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[Schedule Notifications] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

function generateEmailContent(payload: ScheduleNotificationPayload): { subject: string; content: string } {
  const teamName = payload.shift?.team_name || payload.entry?.team_name || 'Your Team';
  const actorName = payload.actor.name || 'Someone';

  switch (payload.type) {
    case 'schedule_shift_assigned':
      return {
        subject: `New Shift Assignment - ${payload.shift?.title || 'Shift'}`,
        content: `
          <h2>Shift Assigned</h2>
          <p>Hi {{recipient_name}},</p>
          <p>You've been assigned a new shift:</p>
          <ul>
            <li><strong>Title:</strong> ${payload.shift?.title || 'Untitled Shift'}</li>
            <li><strong>Team:</strong> ${teamName}</li>
            <li><strong>Start:</strong> ${new Date(payload.shift?.starts_at || '').toLocaleString()}</li>
            <li><strong>End:</strong> ${new Date(payload.shift?.ends_at || '').toLocaleString()}</li>
            ${payload.shift?.location ? `<li><strong>Location:</strong> ${payload.shift.location}</li>` : ''}
            ${payload.shift?.notes ? `<li><strong>Notes:</strong> ${payload.shift.notes}</li>` : ''}
          </ul>
          <p>Assigned by: ${actorName}</p>
          <p>Please check your schedule for more details.</p>
        `
      };

    case 'schedule_shift_updated':
      return {
        subject: `Shift Updated - ${payload.shift?.title || 'Shift'}`,
        content: `
          <h2>Shift Updated</h2>
          <p>Hi {{recipient_name}},</p>
          <p>A shift has been updated:</p>
          <ul>
            <li><strong>Title:</strong> ${payload.shift?.title || 'Untitled Shift'}</li>
            <li><strong>Team:</strong> ${teamName}</li>
            <li><strong>Start:</strong> ${new Date(payload.shift?.starts_at || '').toLocaleString()}</li>
            <li><strong>End:</strong> ${new Date(payload.shift?.ends_at || '').toLocaleString()}</li>
            ${payload.shift?.location ? `<li><strong>Location:</strong> ${payload.shift.location}</li>` : ''}
            ${payload.shift?.notes ? `<li><strong>Notes:</strong> ${payload.shift.notes}</li>` : ''}
          </ul>
          <p>Updated by: ${actorName}</p>
          <p>Please review the changes in your schedule.</p>
        `
      };

    case 'schedule_shift_canceled':
      return {
        subject: `Shift Canceled - ${payload.shift?.title || 'Shift'}`,
        content: `
          <h2>Shift Canceled</h2>
          <p>Hi {{recipient_name}},</p>
          <p>A shift has been canceled:</p>
          <ul>
            <li><strong>Title:</strong> ${payload.shift?.title || 'Untitled Shift'}</li>
            <li><strong>Team:</strong> ${teamName}</li>
            <li><strong>Was scheduled for:</strong> ${new Date(payload.shift?.starts_at || '').toLocaleString()}</li>
          </ul>
          <p>Canceled by: ${actorName}</p>
          <p>Please check your schedule for any updates.</p>
        `
      };

    case 'schedule_time_entry_opened':
      return {
        subject: `Time Clock In - ${payload.entry?.user_name || 'Employee'}`,
        content: `
          <h2>Employee Clocked In</h2>
          <p>Hi {{recipient_name}},</p>
          <p>${payload.entry?.user_name || 'An employee'} has clocked in:</p>
          <ul>
            <li><strong>Time:</strong> ${new Date(payload.entry?.clock_in || '').toLocaleString()}</li>
            <li><strong>Team:</strong> ${teamName}</li>
            ${payload.entry?.notes ? `<li><strong>Notes:</strong> ${payload.entry.notes}</li>` : ''}
          </ul>
          <p>This is an automated notification from your time tracking system.</p>
        `
      };

    case 'schedule_time_entry_closed':
      return {
        subject: `Time Clock Out - ${payload.entry?.user_name || 'Employee'}`,
        content: `
          <h2>Employee Clocked Out</h2>
          <p>Hi {{recipient_name}},</p>
          <p>${payload.entry?.user_name || 'An employee'} has clocked out:</p>
          <ul>
            <li><strong>Clock In:</strong> ${new Date(payload.entry?.clock_in || '').toLocaleString()}</li>
            <li><strong>Clock Out:</strong> ${new Date(payload.entry?.clock_out || '').toLocaleString()}</li>
            <li><strong>Duration:</strong> ${payload.entry?.duration_minutes || 0} minutes</li>
            <li><strong>Team:</strong> ${teamName}</li>
            ${payload.entry?.notes ? `<li><strong>Notes:</strong> ${payload.entry.notes}</li>` : ''}
          </ul>
          <p>This is an automated notification from your time tracking system.</p>
        `
      };

    case 'time_entry_approved':
      return {
        subject: `Time Entry Approved - ${new Date(payload.entry?.work_date || '').toLocaleDateString()}`,
        content: `
          <h2>Time Entry Approved</h2>
          <p>Hi {{recipient_name}},</p>
          <p>Your time entry has been approved:</p>
          <ul>
            <li><strong>Date:</strong> ${new Date(payload.entry?.work_date || '').toLocaleDateString()}</li>
            <li><strong>Duration:</strong> ${payload.entry?.duration_minutes || 0} minutes</li>
            <li><strong>Approved by:</strong> ${payload.approver?.name || 'Manager'}</li>
            ${payload.approval_notes ? `<li><strong>Notes:</strong> ${payload.approval_notes}</li>` : ''}
          </ul>
          <p>This time entry is now approved and will be included in payroll calculations.</p>
        `
      };

    case 'time_entry_rejected':
      return {
        subject: `Time Entry Rejected - ${new Date(payload.entry?.work_date || '').toLocaleDateString()}`,
        content: `
          <h2>Time Entry Rejected</h2>
          <p>Hi {{recipient_name}},</p>
          <p>Unfortunately, your time entry has been rejected:</p>
          <ul>
            <li><strong>Date:</strong> ${new Date(payload.entry?.work_date || '').toLocaleDateString()}</li>
            <li><strong>Duration:</strong> ${payload.entry?.duration_minutes || 0} minutes</li>
            <li><strong>Rejected by:</strong> ${payload.approver?.name || 'Manager'}</li>
            <li><strong>Reason:</strong> ${payload.rejection_reason || 'No reason provided'}</li>
          </ul>
          <p>Please contact your manager for clarification or to resubmit a corrected entry.</p>
        `
      };

    case 'time_entry_needs_approval':
      return {
        subject: `Time Entry Needs Approval - ${payload.entry?.user_name || 'Employee'}`,
        content: `
          <h2>Time Entry Requires Approval</h2>
          <p>Hi {{recipient_name}},</p>
          <p>${payload.entry?.user_name || 'An employee'} has submitted a time entry that requires your approval:</p>
          <ul>
            <li><strong>Employee:</strong> ${payload.entry?.user_name || 'Unknown'}</li>
            <li><strong>Date:</strong> ${new Date(payload.entry?.work_date || '').toLocaleDateString()}</li>
            <li><strong>Duration:</strong> ${payload.entry?.duration_minutes || 0} minutes</li>
            <li><strong>Team:</strong> ${teamName}</li>
            ${payload.entry?.notes ? `<li><strong>Notes:</strong> ${payload.entry.notes}</li>` : ''}
          </ul>
          <p>Please log in to the system to review and approve this time entry.</p>
        `
      };

    default:
      return {
        subject: 'Schedule Notification',
        content: `
          <h2>Schedule Update</h2>
          <p>Hi {{recipient_name}},</p>
          <p>There has been an update to your schedule. Please check your schedule for details.</p>
        `
      };
  }
}

serve(handler);