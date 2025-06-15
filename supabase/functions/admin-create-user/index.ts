
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  name: string;
  role: string;
  temporaryPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with anon key for validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the requesting user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User verification failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the requesting user's details from the users table
    const { data: requestingUser, error: requestingUserError } = await supabase
      .from('users')
      .select('role, organization_id, name, email')
      .eq('id', user.id)
      .single();

    if (requestingUserError || !requestingUser) {
      console.error('Failed to get requesting user details:', requestingUserError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify user permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user is a superadmin
    if (requestingUser.role !== 'superadmin') {
      console.error('Non-superadmin attempted user creation:', requestingUser.email);
      return new Response(
        JSON.stringify({ error: 'Only superadmins can create users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email, name, role, temporaryPassword }: CreateUserRequest = await req.json();

    if (!email || !name || !role || !temporaryPassword) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if trying to create another superadmin
    if (role === 'superadmin') {
      const { data: existingSuperadmins, error: superadminError } = await supabase
        .from('users')
        .select('id, name')
        .eq('organization_id', requestingUser.organization_id)
        .eq('role', 'superadmin');

      if (superadminError) {
        console.error('Error checking existing superadmins:', superadminError);
        return new Response(
          JSON.stringify({ error: 'Failed to validate superadmin constraints' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (existingSuperadmins && existingSuperadmins.length > 0) {
        return new Response(
          JSON.stringify({ 
            error: 'Cannot create another superadmin. Only one superadmin is allowed per organization.' 
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create client with service role for admin operations
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Creating user:', { email, name, role, organizationId: requestingUser.organization_id });

    // Create user in auth using admin API
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password: temporaryPassword,
      user_metadata: {
        organization_id: requestingUser.organization_id,
        role,
        name
      },
      email_confirm: true // Auto-confirm email
    });

    if (authError) {
      console.error('Error creating user in auth:', authError);
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${authError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.user) {
      console.error('No user data returned from auth creation');
      return new Response(
        JSON.stringify({ error: 'User creation failed - no user data returned' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created successfully in auth:', authData.user.id);

    // Log audit trail using the anon client (proper RLS context)
    try {
      await supabase.from('user_management_audit').insert({
        organization_id: requestingUser.organization_id,
        action_type: 'create',
        target_user_id: authData.user.id,
        target_user_email: email,
        target_user_name: name,
        performed_by_user_id: user.id,
        performed_by_email: requestingUser.email,
        old_values: {},
        new_values: { role, name, email },
        ip_address: null,
        user_agent: req.headers.get('user-agent')
      });
      console.log('Audit trail logged successfully');
    } catch (auditError) {
      console.error('Failed to log audit trail:', auditError);
      // Don't fail the request for audit logging issues
    }

    console.log('User creation completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: name,
          role: role
        },
        message: `User ${name} created successfully`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Unexpected error in admin-create-user function:', error);
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
