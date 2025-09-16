import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
  attendees?: Array<{ email: string }>;
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
    };
  };
}

async function refreshGoogleToken(refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Google token');
  }

  const data = await response.json();
  return data.access_token;
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

    const { meetingId, action = 'create' } = await req.json();

    if (!meetingId) {
      throw new Error('Meeting ID is required');
    }

    console.log(`Processing ${action} action for meeting:`, meetingId);

    // Get meeting details with participants
    const { data: meeting, error: meetingError } = await supabase
      .from('meeting_requests')
      .select(`
        *,
        meeting_participants (
          user_id,
          users (email, name)
        )
      `)
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      throw new Error('Meeting not found');
    }

    // Get organizer's Google tokens
    const { data: organizer, error: organizerError } = await supabase
      .from('users')
      .select('google_calendar_token, google_refresh_token, google_calendar_sync_enabled')
      .eq('id', meeting.organizer_id)
      .single();

    if (organizerError || !organizer) {
      throw new Error('Organizer not found');
    }

    if (!organizer.google_calendar_sync_enabled || !organizer.google_refresh_token) {
      throw new Error('Google Calendar not connected for organizer');
    }

    // Refresh access token
    let accessToken = organizer.google_calendar_token;
    try {
      accessToken = await refreshGoogleToken(organizer.google_refresh_token);
      
      // Update the access token in database
      await supabase
        .from('users')
        .update({ google_calendar_token: accessToken })
        .eq('id', meeting.organizer_id);
    } catch (tokenError) {
      console.error('Token refresh failed:', tokenError);
      throw new Error('Failed to refresh Google Calendar access');
    }

    let googleEventId = meeting.google_event_id;
    let googleMeetUrl = meeting.google_meet_url;

    if (action === 'create' || action === 'update') {
      // Prepare event data
      const eventData: GoogleCalendarEvent = {
        summary: meeting.title,
        description: meeting.description || '',
        start: {
          dateTime: meeting.start_time,
          timeZone: 'UTC',
        },
        end: {
          dateTime: meeting.end_time,
          timeZone: 'UTC',
        },
        location: meeting.location || '',
        attendees: meeting.meeting_participants?.map((p: any) => ({
          email: p.users.email
        })) || [],
      };

      // Add Google Meet conference data
      if (!googleMeetUrl) {
        eventData.conferenceData = {
          createRequest: {
            requestId: `meet-${meetingId}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        };
      }

      let response;
      if (action === 'create' && !googleEventId) {
        // Create new event
        response = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
          }
        );
      } else if (googleEventId) {
        // Update existing event
        response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}?conferenceDataVersion=1`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
          }
        );
      } else {
        throw new Error('Invalid action or missing Google event ID');
      }

      if (!response.ok) {
        const error = await response.text();
        console.error('Google Calendar API error:', error);
        throw new Error('Failed to sync with Google Calendar');
      }

      const eventResult = await response.json();
      googleEventId = eventResult.id;
      googleMeetUrl = eventResult.conferenceData?.entryPoints?.find(
        (ep: any) => ep.entryPointType === 'video'
      )?.uri || googleMeetUrl;

      // Update meeting with Google event details
      const { error: updateError } = await supabase
        .from('meeting_requests')
        .update({
          google_event_id: googleEventId,
          google_meet_url: googleMeetUrl,
          sync_status: 'synced',
        })
        .eq('id', meetingId);

      if (updateError) {
        console.error('Failed to update meeting:', updateError);
      }

    } else if (action === 'delete' && googleEventId) {
      // Delete Google Calendar event
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok && response.status !== 404) {
        const error = await response.text();
        console.error('Failed to delete Google Calendar event:', error);
        throw new Error('Failed to delete from Google Calendar');
      }

      // Update meeting sync status
      await supabase
        .from('meeting_requests')
        .update({
          sync_status: 'not_synced',
        })
        .eq('id', meetingId);
    }

    // Log sync activity
    await supabase
      .from('calendar_sync_log')
      .insert({
        user_id: meeting.organizer_id,
        organization_id: meeting.organization_id,
        meeting_request_id: meetingId,
        sync_type: action === 'delete' ? 'delete_google' : 'export_to_google',
        google_event_id: googleEventId,
        status: 'success',
      });

    console.log(`Successfully ${action}d meeting in Google Calendar:`, googleEventId);

    return new Response(JSON.stringify({ 
      success: true,
      google_event_id: googleEventId,
      google_meet_url: googleMeetUrl,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-meeting-to-google function:', error);
    
    // Log failed sync attempt
    try {
      const { meetingId } = await req.json();
      if (meetingId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('calendar_sync_log')
          .insert({
            meeting_request_id: meetingId,
            sync_type: 'export_to_google',
            status: 'failed',
            error_message: error.message,
          });
      }
    } catch (logError) {
      console.error('Failed to log sync error:', logError);
    }

    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});