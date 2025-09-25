import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  userId: string;
  newEmail: string;
  reason?: 'email_change' | 'security' | 'manual';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, newEmail, reason = 'email_change' }: RequestBody = await req.json();

    console.log(`🔄 Invalidating Google Calendar tokens for user ${userId} due to ${reason}`);

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get user's current Google Calendar tokens
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('google_calendar_token, google_refresh_token, google_calendar_sync_enabled, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    // If user doesn't have Google Calendar connected, nothing to invalidate
    if (!user.google_calendar_sync_enabled || !user.google_refresh_token) {
      console.log(`✅ No Google Calendar tokens to invalidate for user ${userId}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No Google Calendar tokens to invalidate',
          requiresReauth: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Invalidate the Google Calendar tokens by clearing them from the database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        google_calendar_token: null,
        google_refresh_token: null,
        google_calendar_sync_enabled: false,
        // Add a timestamp to track when tokens were invalidated
        google_tokens_invalidated_at: new Date().toISOString(),
        google_token_invalidation_reason: reason
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Failed to invalidate tokens:', updateError);
      throw new Error('Failed to invalidate Google Calendar tokens');
    }

    // Log the invalidation for security audit
    console.log(`✅ Google Calendar tokens invalidated for user ${userId}`);
    console.log(`   - Reason: ${reason}`);
    console.log(`   - Old email: ${user.email}`);
    console.log(`   - New email: ${newEmail || 'N/A'}`);

    // Create a notification for the user about the token invalidation
    if (reason === 'email_change') {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'Google Calendar Re-authentication Required',
          content: `Your email change requires re-connecting Google Calendar. Please go to Settings to reconnect.`,
          type: 'google_calendar_reauth',
          organization_id: (await supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .single()
          ).data?.organization_id
        });

      if (notificationError) {
        console.error('❌ Failed to create notification:', notificationError);
        // Don't fail the main operation for notification errors
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Google Calendar tokens invalidated successfully',
        requiresReauth: true,
        reason
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error invalidating Google Calendar tokens:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) || 'Failed to invalidate Google Calendar tokens'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});