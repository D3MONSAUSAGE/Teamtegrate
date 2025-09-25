
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Running timezone-aware notifications and daily emails check...')

    // Call the enhanced database function to send both reminders and daily emails
    const { error: reminderError } = await supabaseClient.rpc('send_daily_emails_and_reminders')

    if (reminderError) {
      console.error('Error calling send_daily_emails_and_reminders:', reminderError)
      throw reminderError
    }

    // Process daily email notifications that were created
    const { data: emailNotifications, error: fetchError } = await supabaseClient
      .from('notifications')
      .select('user_id')
      .eq('type', 'daily_email')
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes

    if (fetchError) {
      console.error('Error fetching email notifications:', fetchError)
      throw fetchError
    }

    console.log(`Found ${emailNotifications?.length || 0} daily email notifications to process`)

    // Send daily emails for each user
    if (emailNotifications && emailNotifications.length > 0) {
      const uniqueUserIds = [...new Set(emailNotifications.map(n => n.user_id))]
      
      for (const userId of uniqueUserIds) {
        try {
          console.log('Sending daily email for user:', userId)
          
          const { error: emailError } = await supabaseClient.functions.invoke('send-daily-task-email', {
            body: { user_id: userId }
          })

          if (emailError) {
            console.error(`Error sending email to user ${userId}:`, emailError)
          } else {
            console.log(`Daily email sent successfully to user ${userId}`)
          }
        } catch (error) {
          console.error(`Failed to send email to user ${userId}:`, error)
        }
      }
    }

    console.log('Timezone-aware notifications and daily emails check completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Timezone-aware notifications and daily emails processed successfully',
        daily_emails_sent: emailNotifications?.length || 0,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in timezone-notifications function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
