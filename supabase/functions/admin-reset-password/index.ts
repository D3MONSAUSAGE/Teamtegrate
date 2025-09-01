import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface ResetPasswordRequest {
  email: string;
  action: 'send_recovery_link' | 'set_temporary_password';
  temporaryPassword?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!serviceRoleKey || !supabaseUrl) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { email, action, temporaryPassword }: ResetPasswordRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the requesting user is an admin/superadmin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !userData.user) {
      console.error('User verification failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin/superadmin
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('role, organization_id')
      .eq('id', userData.user.id)
      .single();

    if (adminError || !adminUser || !['admin', 'superadmin'].includes(adminUser.role)) {
      console.error('Access denied:', { userId: userData.user.id, role: adminUser?.role });
      return new Response(
        JSON.stringify({ error: 'Access denied. Only admins and superadmins can reset passwords.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the target user
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('users')
      .select('id, name, organization_id')
      .eq('email', email)
      .single();

    if (targetError || !targetUser) {
      console.error('Target user not found:', email);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify same organization (unless superadmin)
    if (adminUser.role !== 'superadmin' && adminUser.organization_id !== targetUser.organization_id) {
      return new Response(
        JSON.stringify({ error: 'Can only reset passwords for users in your organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: any = {};

    if (action === 'send_recovery_link') {
      // Generate recovery link
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: `${req.headers.get('origin') || 'https://91cd77c4-34d9-4c9a-a240-33280dceab90.sandbox.lovable.dev'}/reset-password`
        }
      });

      if (error) {
        console.error('Failed to generate recovery link:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to generate recovery link' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      result = { recoveryLink: data.properties?.action_link };

      // Send email if Resend is configured
      if (resendApiKey && data.properties?.action_link) {
        const resend = new Resend(resendApiKey);
        
        try {
          await resend.emails.send({
            from: "TeamTegrate <noreply@resend.dev>",
            to: [email],
            subject: "Password Reset Request",
            html: `
              <h2>Password Reset Request</h2>
              <p>Hello ${targetUser.name || 'there'},</p>
              <p>An administrator has initiated a password reset for your account.</p>
              <p>Click the link below to set a new password:</p>
              <p><a href="${data.properties.action_link}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't request this reset, please contact your administrator.</p>
              <br>
              <p>Best regards,<br>TeamTegrate Team</p>
            `,
          });
          
          result.emailSent = true;
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
          result.emailSent = false;
          result.emailError = 'Failed to send email notification';
        }
      }

    } else if (action === 'set_temporary_password') {
      if (!temporaryPassword || temporaryPassword.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Temporary password must be at least 6 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update user password directly
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        targetUser.id,
        { password: temporaryPassword }
      );

      if (error) {
        console.error('Failed to set temporary password:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to set temporary password' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      result = { temporaryPasswordSet: true };

      // Send email notification if Resend is configured
      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        
        try {
          await resend.emails.send({
            from: "TeamTegrate <noreply@resend.dev>",
            to: [email],
            subject: "Temporary Password Set",
            html: `
              <h2>Temporary Password</h2>
              <p>Hello ${targetUser.name || 'there'},</p>
              <p>An administrator has set a temporary password for your account:</p>
              <p><strong>Temporary Password:</strong> <code>${temporaryPassword}</code></p>
              <p>Please log in and change your password immediately.</p>
              <p><a href="${req.headers.get('origin') || 'https://91cd77c4-34d9-4c9a-a240-33280dceab90.sandbox.lovable.dev'}/login">Login Now</a></p>
              <br>
              <p>Best regards,<br>TeamTegrate Team</p>
            `,
          });
          
          result.emailSent = true;
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
          result.emailSent = false;
          result.emailError = 'Failed to send email notification';
        }
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "send_recovery_link" or "set_temporary_password"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the action for audit purposes
    await supabaseAdmin
      .from('admin_access_audit')
      .insert({
        admin_user_id: userData.user.id,
        target_user_id: targetUser.id,
        organization_id: adminUser.organization_id,
        access_type: `password_reset_${action}`,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });

    console.log(`Password reset action completed: ${action} for ${email} by ${userData.user.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Password reset ${action} completed successfully`,
        ...result
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in admin-reset-password function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);