import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { instanceId, action } = await req.json()

    // Get current server time (UTC) to prevent client-side manipulation
    const serverTime = new Date()

    // Fetch the checklist instance with template details
    const { data: instance, error: instanceError } = await supabaseClient
      .from('checklist_instances_v2')
      .select(`
        *,
        template:checklist_templates_v2(
          name,
          start_time,
          end_time,
          require_verification
        )
      `)
      .eq('id', instanceId)
      .single()

    if (instanceError || !instance) {
      return new Response(
        JSON.stringify({ error: 'Checklist instance not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if instance is already expired or completed
    if (instance.status === 'verified' || instance.status === 'rejected') {
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          reason: 'This checklist has already been finalized',
          serverTime: serverTime.toISOString()
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the checklist date and time windows
    const checklistDate = new Date(instance.date)
    const template = instance.template

    // If no time window is set, allow anytime
    if (!template?.start_time || !template?.end_time) {
      return new Response(
        JSON.stringify({ 
          allowed: true, 
          serverTime: serverTime.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse time windows (HH:mm format)
    const [startHour, startMinute] = template.start_time.split(':').map(Number)
    const [endHour, endMinute] = template.end_time.split(':').map(Number)

    const windowStart = new Date(checklistDate)
    windowStart.setHours(startHour, startMinute, 0, 0)

    const windowEnd = new Date(checklistDate)
    windowEnd.setHours(endHour, endMinute, 0, 0)

    // Handle overnight windows
    if (windowEnd <= windowStart) {
      windowEnd.setDate(windowEnd.getDate() + 1)
    }

    const isWithinWindow = serverTime >= windowStart && serverTime <= windowEnd
    const isExpired = serverTime > windowEnd

    // Execution actions require being within window
    if (action === 'execute' || action === 'submit') {
      if (isExpired) {
        // Auto-expire the instance
        await supabaseClient
          .from('checklist_instances_v2')
          .update({ status: 'expired' })
          .eq('id', instanceId)

        return new Response(
          JSON.stringify({ 
            allowed: false, 
            reason: 'Time window has expired. This checklist is now closed.',
            serverTime: serverTime.toISOString(),
            windowEnd: windowEnd.toISOString()
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!isWithinWindow) {
        const timeUntilStart = Math.ceil((windowStart.getTime() - serverTime.getTime()) / (1000 * 60))
        return new Response(
          JSON.stringify({ 
            allowed: false, 
            reason: `This checklist is not yet available. Opens in ${timeUntilStart} minutes.`,
            serverTime: serverTime.toISOString(),
            windowStart: windowStart.toISOString()
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Verification can happen after window closes (for managers)
    if (action === 'verify') {
      if (instance.status !== 'submitted') {
        return new Response(
          JSON.stringify({ 
            allowed: false, 
            reason: 'Only submitted checklists can be verified',
            serverTime: serverTime.toISOString()
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ 
        allowed: true, 
        serverTime: serverTime.toISOString(),
        timeRemaining: isWithinWindow ? Math.ceil((windowEnd.getTime() - serverTime.getTime()) / (1000 * 60)) : 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error validating checklist time:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})