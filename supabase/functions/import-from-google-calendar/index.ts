import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
};

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{ email: string; responseStatus: string }>;
  created: string;
  updated: string;
  status: string;
  conferenceData?: {
    entryPoints: Array<{
      entryPointType: string;
      uri: string;
    }>;
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

    const { userId, calendarId = 'primary', timeMin, timeMax, forceFullSync = false } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log(`Importing Google Calendar events for user:`, userId);

    // Get user's Google tokens and organization
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('google_calendar_token, google_refresh_token, google_calendar_sync_enabled, organization_id, email, name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    if (!user.google_calendar_sync_enabled || !user.google_refresh_token) {
      throw new Error('Google Calendar not connected for user');
    }

    // Get user's sync preferences
    const { data: preferences } = await supabase
      .from('google_calendar_sync_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (preferences && !preferences.import_enabled) {
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Import disabled in user preferences',
        imported: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Refresh access token
    let accessToken = user.google_calendar_token;
    try {
      accessToken = await refreshGoogleToken(user.google_refresh_token);
      
      // Update the access token in database
      await supabase
        .from('users')
        .update({ google_calendar_token: accessToken })
        .eq('id', userId);
    } catch (tokenError) {
      console.error('Token refresh failed:', tokenError);
      throw new Error('Failed to refresh Google Calendar access');
    }

    // Construct Google Calendar API URL for events
    const params = new URLSearchParams({
      orderBy: 'startTime',
      singleEvents: 'true',
      maxResults: '250'
    });

    // Set time range for sync (default to last 30 days to future 90 days)
    const defaultTimeMin = timeMin || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const defaultTimeMax = timeMax || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    
    params.append('timeMin', defaultTimeMin);
    params.append('timeMax', defaultTimeMax);

    const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`;

    console.log('Fetching Google Calendar events from:', eventsUrl);

    // Fetch events from Google Calendar
    const response = await fetch(eventsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Google Calendar API error:', error);
      throw new Error('Failed to fetch Google Calendar events');
    }

    const data = await response.json();
    const events: GoogleCalendarEvent[] = data.items || [];

    console.log(`Found ${events.length} Google Calendar events`);

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const event of events) {
      try {
        // Skip events without dateTime (all-day events for now)
        if (!event.start.dateTime || !event.end.dateTime) {
          skippedCount++;
          continue;
        }

        // Skip cancelled events
        if (event.status === 'cancelled') {
          // Check if we have this event in our system and mark it as cancelled
          const { data: existingMeeting } = await supabase
            .from('meeting_requests')
            .select('id')
            .eq('google_event_id', event.id)
            .eq('organization_id', user.organization_id)
            .single();

          if (existingMeeting) {
            await supabase
              .from('meeting_requests')
              .update({ 
                status: 'cancelled',
                sync_status: 'synced'
              })
              .eq('id', existingMeeting.id);
            updatedCount++;
          }
          continue;
        }

        // Check if we already have this event
        const { data: existingMeeting } = await supabase
          .from('meeting_requests')
          .select('id, updated_at, google_event_id')
          .eq('google_event_id', event.id)
          .eq('organization_id', user.organization_id)
          .single();

        // Extract Google Meet URL from conference data
        const googleMeetUrl = event.conferenceData?.entryPoints?.find(
          (ep) => ep.entryPointType === 'video'
        )?.uri;

        const meetingData = {
          title: event.summary || 'Untitled Event',
          description: event.description || '',
          start_time: event.start.dateTime,
          end_time: event.end.dateTime,
          location: event.location || '',
          google_event_id: event.id,
          google_meet_url: googleMeetUrl,
          sync_status: 'synced',
          status: 'pending' as const,
          organization_id: user.organization_id,
          organizer_id: userId
        };

        if (existingMeeting) {
          // Update existing meeting if Google event is newer
          const googleUpdated = new Date(event.updated);
          const localUpdated = new Date(existingMeeting.updated_at);

          if (googleUpdated > localUpdated || forceFullSync) {
            const { error: updateError } = await supabase
              .from('meeting_requests')
              .update(meetingData)
              .eq('id', existingMeeting.id);

            if (!updateError) {
              console.log(`Updated meeting from Google event: ${event.summary}`);
              updatedCount++;
            }
          } else {
            skippedCount++;
          }
        } else {
          // Create new meeting from Google event
          const { data: newMeeting, error: insertError } = await supabase
            .from('meeting_requests')
            .insert(meetingData)
            .select('id')
            .single();

          if (!insertError && newMeeting) {
            // Add organizer as participant
            await supabase
              .from('meeting_participants')
              .insert({
                meeting_request_id: newMeeting.id,
                user_id: userId,
                organization_id: user.organization_id,
                response_status: 'accepted'
              });

            // Add other attendees if any
            if (event.attendees && event.attendees.length > 0) {
              for (const attendee of event.attendees) {
                if (attendee.email !== user.email) {
                  // Try to find user by email in organization
                  const { data: attendeeUser } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', attendee.email)
                    .eq('organization_id', user.organization_id)
                    .single();

                  if (attendeeUser) {
                    await supabase
                      .from('meeting_participants')
                      .insert({
                        meeting_request_id: newMeeting.id,
                        user_id: attendeeUser.id,
                        organization_id: user.organization_id,
                        response_status: attendee.responseStatus === 'accepted' ? 'accepted' : 
                                       attendee.responseStatus === 'declined' ? 'declined' :
                                       attendee.responseStatus === 'tentative' ? 'tentative' : 'invited'
                      });
                  }
                }
              }
            }

            console.log(`Imported new meeting from Google event: ${event.summary}`);
            importedCount++;
          }
        }

        // Log the sync activity
        await supabase
          .from('calendar_sync_log')
          .insert({
            user_id: userId,
            organization_id: user.organization_id,
            sync_type: 'import_from_google',
            google_event_id: event.id,
            status: 'success'
          });

      } catch (eventError) {
        console.error(`Error processing event ${event.id}:`, eventError);
        
        // Log the failed sync
        await supabase
          .from('calendar_sync_log')
          .insert({
            user_id: userId,
            organization_id: user.organization_id,
            sync_type: 'import_from_google',
            google_event_id: event.id,
            status: 'failed',
            error_message: eventError instanceof Error ? eventError.message : String(eventError)
          });
      }
    }

    console.log(`Import complete: ${importedCount} new, ${updatedCount} updated, ${skippedCount} skipped`);

    return new Response(JSON.stringify({ 
      success: true,
      imported: importedCount,
      updated: updatedCount,
      skipped: skippedCount,
      total: events.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in import-from-google-calendar function:', error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : String(error) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});