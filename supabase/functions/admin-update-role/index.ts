import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

Deno.serve(async (req) => {
  console.log('admin-update-role function called')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { userId, newRole } = await req.json()
    
    console.log(`Updating user ${userId} role to ${newRole}`)
    
    // SECURITY: Get the requesting user's info from the JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requestingUser }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Get requesting user's details
    const { data: requesterData, error: requesterError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', requestingUser.id)
      .single()
      
    if (requesterError || !requesterData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Requester not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Get target user's details
    const { data: targetData, error: targetError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', userId)
      .single()
      
    if (targetError || !targetData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Target user not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // SECURITY: Validate role change permissions using centralized hierarchy
    type UserRole = 'user' | 'team_leader' | 'manager' | 'admin' | 'superadmin';
    
    const roleHierarchy: Record<UserRole, number> = {
      'user': 1,
      'team_leader': 2,
      'manager': 3,
      'admin': 4,
      'superadmin': 5
    }
    
    const requesterLevel = roleHierarchy[requesterData.role as UserRole] || 0
    const targetLevel = roleHierarchy[targetData.role as UserRole] || 0  
    const newRoleLevel = roleHierarchy[newRole as UserRole] || 0
    
    // Validation rules:
    // 1. Must be in same organization
    if (requesterData.organization_id !== targetData.organization_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cross-organization role changes not allowed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // 2. Requester must have higher level than target
    if (requesterLevel <= targetLevel) {
      return new Response(
        JSON.stringify({ success: false, error: 'Insufficient privileges to change this user\'s role' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // 3. Requester must have higher level than new role (can't promote above themselves)
    if (requesterLevel <= newRoleLevel) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot assign role higher than or equal to your own' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // 4. Only superadmins can change superadmin roles
    if ((targetData.role === 'superadmin' || newRole === 'superadmin') && requesterData.role !== 'superadmin') {
      return new Response(
        JSON.stringify({ success: false, error: 'Only superadmins can manage superadmin roles' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // 5. Prevent demoting last superadmin
    if (targetData.role === 'superadmin' && newRole !== 'superadmin') {
      const { data: superadminCount } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('organization_id', targetData.organization_id)
        .eq('role', 'superadmin')
        .neq('id', userId)
        
      if (!superadminCount || superadminCount.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Cannot demote the last superadmin in organization' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }
    
    // All security checks passed - proceed with role update
    const { data, error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .select('id, email, name, role')
      .single()
    
    if (error) {
      console.error('Error updating user role:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    console.log('User role updated successfully:', data)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        user: data,
        message: 'Role updated successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error) 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})