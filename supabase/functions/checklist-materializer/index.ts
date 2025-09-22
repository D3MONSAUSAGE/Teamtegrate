import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MaterializerResponse {
  success: boolean;
  created: number;
  skipped: number;
  error?: string;
  correlationId: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId = crypto.randomUUID();
  
  try {
    console.log(`📋 Checklist Materializer started`, { correlationId });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current date in UTC (we'll handle timezones per org)
    const today = new Date().toISOString().split('T')[0];
    
    // Get all active templates with their organization timezones
    const { data: templates, error: templatesError } = await supabase
      .from('checklist_templates_v2')
      .select(`
        *,
        organizations!inner(timezone)
      `)
      .eq('is_active', true);

    if (templatesError) {
      throw new Error(`Failed to fetch templates: ${templatesError.message}`);
    }

    console.log(`📋 Found ${templates?.length || 0} active templates`, { correlationId });

    let created = 0;
    let skipped = 0;

    for (const template of templates || []) {
      try {
        // Calculate today in organization's timezone
        const orgTimezone = template.organizations?.timezone || 'UTC';
        const orgToday = new Date().toLocaleDateString('en-CA', { timeZone: orgTimezone });
        
        // Check if template is scheduled for today
        const dayOfWeek = new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          timeZone: orgTimezone 
        }).toLowerCase();
        
        const isScheduledToday = !template.scheduled_days || 
          template.scheduled_days.length === 0 || 
          template.scheduled_days.includes(dayOfWeek);

        if (!isScheduledToday) {
          console.log(`⏭️ Template ${template.name} not scheduled for ${dayOfWeek}`, { correlationId });
          skipped++;
          continue;
        }

        // Calculate scheduled start/end times in organization timezone
        let scheduledStart = null;
        let scheduledEnd = null;
        
        if (template.start_time) {
          const startDateTime = new Date(`${orgToday}T${template.start_time}`);
          scheduledStart = startDateTime.toISOString();
        }
        
        if (template.end_time) {
          const endDateTime = new Date(`${orgToday}T${template.end_time}`);
          scheduledEnd = endDateTime.toISOString();
        }

        // Insert instance with conflict handling (idempotent)
        const { data: instanceData, error: instanceError } = await supabase
          .from('checklist_instances_v2')
          .insert({
            template_id: template.id,
            org_id: template.org_id,
            team_id: template.team_id,
            date: orgToday,
            scheduled_start: scheduledStart,
            scheduled_end: scheduledEnd,
            status: 'pending'
          })
          .select()
          .single();

        if (instanceError) {
          if (instanceError.code === '23505') { // Unique constraint violation
            console.log(`⏭️ Instance already exists for template ${template.name} on ${orgToday}`, { correlationId });
            skipped++;
            continue;
          }
          throw instanceError;
        }

        // Get template items
        const { data: templateItems, error: itemsError } = await supabase
          .from('checklist_template_items_v2')
          .select('*')
          .eq('template_id', template.id)
          .order('position');

        if (itemsError) {
          throw itemsError;
        }

        // Insert item entries for the new instance
        if (templateItems && templateItems.length > 0) {
          const itemEntries = templateItems.map(item => ({
            instance_id: instanceData.id,
            template_item_id: item.id,
            position: item.position,
            value: item.default_value || {},
            executed_status: 'unchecked',
            verified_status: 'unchecked'
          }));

          const { error: entriesError } = await supabase
            .from('checklist_item_entries_v2')
            .insert(itemEntries);

          if (entriesError) {
            throw entriesError;
          }
        }

        console.log(`✅ Created instance for template ${template.name}`, { 
          instanceId: instanceData.id,
          itemsCount: templateItems?.length || 0,
          correlationId 
        });
        created++;

        // Check if we need to send upcoming notifications (30 minutes before start)
        if (scheduledStart) {
          const now = new Date();
          const startTime = new Date(scheduledStart);
          const timeDiff = (startTime.getTime() - now.getTime()) / (1000 * 60); // minutes
          
          // If start time is within 30 minutes, send upcoming notification
          if (timeDiff > 0 && timeDiff <= 30) {
            try {
              console.log(`📧 Sending upcoming notification for template ${template.name}`, { 
                instanceId: instanceData.id,
                minutesUntilStart: Math.round(timeDiff),
                correlationId 
              });
              
              // Build stable idempotency key
              const dedupeKey = `${template.org_id}:${template.team_id || 'no-team'}:checklist_upcoming:${template.id}:${instanceData.id}`;

              // 1. Skip if an in-app notification with same key already exists
              const { data: existing } = await supabase
                .from("notifications")
                .select("id")
                .eq("type", "checklist_upcoming")
                .contains("metadata", { dedupe_key: dedupeKey })
                .maybeSingle();

              if (!existing) {
                // 2. Resolve recipients: team managers + org admins/superadmins (TEAM-BASED, no locations)
                const { data: teamRow } = await supabase
                  .from("teams")
                  .select("id,name,manager_id")
                  .eq("id", template.team_id)
                  .maybeSingle();
                
                const teamName = teamRow?.name ?? "Team";
                const managerIds = teamRow?.manager_id ? [teamRow.manager_id] : [];

                const { data: managers } = await supabase
                  .from("users").select("id,email,name")
                  .in("id", managerIds);

                const { data: admins } = await supabase
                  .from("users").select("id,email,name")
                  .eq("organization_id", template.org_id)
                  .in("role", ["admin","superadmin"]);

                const uniqueRecipients = Array.from(
                  new Map(
                    [...(managers ?? []), ...(admins ?? [])]
                      .filter(u => !!u?.email)
                      .map(u => [u.email.toLowerCase().trim(), u])
                  ).values()
                );

                // 3. Insert in-app notification (idempotent)
                const formatTime = (time: string) => {
                  const [hour, minute] = time.split(':').map(Number);
                  const date = new Date();
                  date.setHours(hour, minute);
                  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                };
                
                const windowLabel = template.start_time && template.end_time 
                  ? `${formatTime(template.start_time)}–${formatTime(template.end_time)}`
                  : 'Today';

                const payload = {
                  checklistId: template.id,
                  checklistTitle: template.name,
                  teamId: template.team_id,
                  teamName,
                  runId: instanceData.id,
                  windowLabel,
                  startTime: scheduledStart,
                  endTime: scheduledEnd,
                  url: `https://app.teamtegrate.com/checklists/runs/${instanceData.id}`
                };

                const { error: insertErr } = await supabase.from("notifications").insert([{
                  type: "checklist_upcoming",
                  organization_id: template.org_id,
                  recipient_ids: uniqueRecipients.map(r => r.id),
                  payload,
                  metadata: { dedupe_key: dedupeKey }
                }]);
                
                if (insertErr && insertErr.code !== "23505") {
                  console.error("[UPCOMING] notifications insert failed", insertErr);
                }

                // 4. Email fan-out via our existing edge function
                const to = uniqueRecipients.map(r => r.email);
                const body = {
                  type: "checklist_upcoming",
                  recipients: to,
                  orgName: template.organizations?.name || 'Organization',
                  teamName,
                  checklist: { id: template.id, title: template.name, priority: template.priority },
                  run: { id: instanceData.id, windowLabel, startTime: scheduledStart, endTime: scheduledEnd },
                  metrics: { percentComplete: 0, itemsTotal: templateItems?.length || 0, itemsDone: 0 }
                };

                const res = await fetch(`${supabaseUrl}/functions/v1/send-checklist-notifications`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(body)
                });

                console.log("CHECKLIST_NOTIFY", {
                  type: "checklist_upcoming",
                  checklistId: template.id,
                  runId: instanceData.id,
                  sent: res.ok,
                  total: to.length,
                  dedupeKey
                });
              } else {
                console.log("[UPCOMING] deduped", dedupeKey);
              }
            } catch (notificationError) {
              console.error(`❌ Failed to send upcoming notification for ${template.name}:`, notificationError);
              // Don't fail the whole process for notification issues
            }
          }
        }

      } catch (error) {
        console.error(`❌ Failed to materialize template ${template.name}:`, error, { correlationId });
        // Continue with other templates
        skipped++;
      }
    }

    const response: MaterializerResponse = {
      success: true,
      created,
      skipped,
      correlationId
    };

    console.log(`📋 Materializer completed:`, response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('❌ Materializer failed:', error, { correlationId });
    
    const response: MaterializerResponse = {
      success: false,
      created: 0,
      skipped: 0,
      error: error.message,
      correlationId
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
});