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