import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  assignmentId: string;
  userId: string;
  type: 'upload' | 'status_change';
  status?: 'verified' | 'rejected';
  courseTitle: string;
  userName?: string;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Certificate notification function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const requestBody: NotificationRequest = await req.json();
    console.log('Notification request:', requestBody);

    const { assignmentId, userId, type, status, courseTitle, userName, notes } = requestBody;

    // Create appropriate notification based on type
    let notificationTitle: string;
    let notificationContent: string;
    let notificationType: string;

    if (type === 'upload') {
      notificationTitle = 'New Certificate Uploaded';
      notificationContent = `${userName || 'A user'} uploaded a certificate for "${courseTitle}"`;
      notificationType = 'certificate_upload';
    } else if (type === 'status_change') {
      notificationTitle = 'Certificate Status Update';
      notificationContent = `Your certificate for "${courseTitle}" has been ${status === 'verified' ? 'approved' : 'rejected'}`;
      if (notes) {
        notificationContent += `. Note: ${notes}`;
      }
      notificationType = 'certificate_status';
    } else {
      throw new Error('Invalid notification type');
    }

    // Get user's organization for proper notification scoping
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      throw new Error('Failed to fetch user information');
    }

    // Create notification in database
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        organization_id: userData.organization_id,
        title: notificationTitle,
        content: notificationContent,
        type: notificationType,
        metadata: {
          assignment_id: assignmentId,
          course_title: courseTitle,
          certificate_status: status,
          verification_notes: notes
        }
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      throw new Error('Failed to create notification');
    }

    console.log('Certificate notification sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Certificate notification sent successfully' 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in certificate notification function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);