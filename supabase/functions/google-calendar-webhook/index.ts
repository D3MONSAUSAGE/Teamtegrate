import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name, x-goog-channel-id, x-goog-channel-token, x-goog-resource-state',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get headers from Google Calendar push notification
    const channelId = req.headers.get('x-goog-channel-id');
    const channelToken = req.headers.get('x-goog-channel-token');
    const resourceState = req.headers.get('x-goog-resource-state');

    console.log('Google Calendar webhook received:', {
      channelId,
      channelToken,
      resourceState,
      method: req.method
    });

    // Validate webhook (in production, you'd want to verify the channel token)
    if (!channelId || !resourceState) {
      console.log('Invalid webhook - missing required headers');
      return new Response('OK', { status: 200 });
    }

    // Handle different resource states
    if (resourceState === 'sync') {
      console.log('Initial sync message - acknowledging');
      return new Response('OK', { status: 200 });
    }

    if (resourceState === 'exists') {
      console.log('Calendar change detected, triggering import for relevant users');

      // Find users with this webhook channel ID (you'd store this during webhook setup)
      // For now, we'll trigger import for all users with Google Calendar enabled
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, organization_id')
        .eq('google_calendar_sync_enabled', true)
        .not('google_refresh_token', 'is', null);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return new Response('Error', { status: 500 });
      }

      if (!users || users.length === 0) {
        console.log('No users found with Google Calendar sync enabled');
        return new Response('OK', { status: 200 });
      }

      // Trigger import for each user (with delay to avoid rate limits)
      let processedUsers = 0;
      const maxUsers = 10; // Process max 10 users per webhook to avoid timeout

      for (const user of users.slice(0, maxUsers)) {
        try {
          // Add a small delay between requests
          if (processedUsers > 0) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          // Trigger import for this user
          const { error: importError } = await supabase.functions.invoke('import-from-google-calendar', {
            body: { 
              userId: user.id,
              timeMin: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // Last hour
              timeMax: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Next 24 hours
            }
          });

          if (importError) {
            console.error(`Import failed for user ${user.id}:`, importError);
          } else {
            console.log(`Triggered import for user: ${user.id}`);
            processedUsers++;
          }

        } catch (userError) {
          console.error(`Error processing user ${user.id}:`, userError);
        }
      }

      console.log(`Webhook processing complete: ${processedUsers} users processed`);
    }

    // Always return 200 OK to Google to acknowledge receipt
    return new Response('OK', { 
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error in google-calendar-webhook function:', error);
    
    // Still return 200 to prevent Google from retrying
    return new Response('OK', { 
      status: 200,
      headers: corsHeaders
    });
  }
});