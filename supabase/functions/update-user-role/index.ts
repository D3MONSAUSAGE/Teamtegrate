
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Get the user making the request
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request data
    const { targetUserId, newRole } = await req.json()

    if (!targetUserId || !newRole) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: targetUserId and newRole' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing role change request:', {
      requestingUserId: user.id,
      targetUserId,
      newRole
    })

    // Get the requesting user's details from the database
    const { data: requestingUser, error: requestingUserError } = await supabaseClient
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (requestingUserError || !requestingUser) {
      console.error('Error fetching requesting user:', requestingUserError)
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the target user's details
    const { data: targetUser, error: targetUserError } = await supabaseClient
      .from('users')
      .select('role, organization_id, name, email')
      .eq('id', targetUserId)
      .single()

    if (targetUserError || !targetUser) {
      console.error('Error fetching target user:', targetUserError)
      return new Response(
        JSON.stringify({ error: 'Target user not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate that users are in the same organization
    if (requestingUser.organization_id !== targetUser.organization_id) {
      return new Response(
        JSON.stringify({ error: 'Users must be in the same organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate permissions using the database function
    const { data: canChangeRole, error: permissionError } = await supabaseClient
      .rpc('can_change_user_role', {
        manager_user_id: user.id,
        target_user_id: targetUserId,
        new_role: newRole
      })

    if (permissionError) {
      console.error('Permission check error:', permissionError)
      return new Response(
        JSON.stringify({ error: 'Permission check failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!canChangeRole.allowed) {
      return new Response(
        JSON.stringify({ error: canChangeRole.reason || 'Permission denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle superadmin role transfer if needed
    if (canChangeRole.requires_transfer) {
      console.log('Performing superadmin role transfer')
      
      const { data: transferResult, error: transferError } = await supabaseClient
        .rpc('transfer_superadmin_role', {
          current_superadmin_id: canChangeRole.current_superadmin_id,
          new_superadmin_id: targetUserId,
          organization_id: targetUser.organization_id
        })

      if (transferError || !transferResult.success) {
        console.error('Transfer error:', transferError, transferResult)
        return new Response(
          JSON.stringify({ error: transferResult?.error || 'Failed to transfer superadmin role' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Role transferred successfully. ${targetUser.name} is now superadmin.`,
          transfer_performed: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Simple role update
      const { error: updateError } = await supabaseClient
        .from('users')
        .update({ role: newRole })
        .eq('id', targetUserId)

      if (updateError) {
        console.error('Role update error:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update role' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Role updated to ${newRole} successfully` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
