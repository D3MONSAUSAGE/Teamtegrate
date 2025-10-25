import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TimeOffBalance {
  id: string;
  organization_id: string;
  user_id: string;
  leave_type: string;
  total_hours: number;
  used_hours: number;
  year: number;
  accrual_method: string;
  is_california_compliant: boolean;
  max_balance_cap: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const today = new Date().toISOString().split('T')[0];

    console.log(`Processing year-end time off carryover for ${currentYear} -> ${nextYear}`);

    // Get all California-compliant sick leave balances for the current year
    const { data: balances, error: fetchError } = await supabase
      .from('employee_time_off_balances')
      .select('*')
      .eq('leave_type', 'sick')
      .eq('is_california_compliant', true)
      .eq('year', currentYear);

    if (fetchError) {
      console.error('Error fetching balances:', fetchError);
      throw fetchError;
    }

    if (!balances || balances.length === 0) {
      console.log('No California-compliant sick leave balances found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          processed: 0,
          message: 'No balances to process'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`Found ${balances.length} sick leave balances to process`);
    const results = [];

    for (const balance of balances as TimeOffBalance[]) {
      try {
        const availableHours = balance.total_hours - balance.used_hours;
        const carryoverHours = Math.min(availableHours, 40); // Max 40 hours carryover per CA law
        const newFrontloadHours = 40; // Standard annual frontload
        const nextYearTotal = Math.min(carryoverHours + newFrontloadHours, 80); // Cap at 80 hours

        console.log(`Processing user ${balance.user_id}: ${availableHours}h available, ${carryoverHours}h carryover`);

        // Check if next year balance already exists
        const { data: existingBalance } = await supabase
          .from('employee_time_off_balances')
          .select('id')
          .eq('user_id', balance.user_id)
          .eq('leave_type', 'sick')
          .eq('year', nextYear)
          .single();

        if (existingBalance) {
          console.log(`Balance already exists for user ${balance.user_id} for year ${nextYear}, skipping`);
          continue;
        }

        // Create next year's balance
        const { data: newBalance, error: insertError } = await supabase
          .from('employee_time_off_balances')
          .insert({
            organization_id: balance.organization_id,
            user_id: balance.user_id,
            leave_type: 'sick',
            total_hours: nextYearTotal,
            used_hours: 0,
            accrual_rate: 0,
            year: nextYear,
            accrual_method: 'frontload',
            waiting_period_days: 0, // No waiting period for existing employees
            is_california_compliant: true,
            last_frontload_date: today,
            carryover_from_previous_year: carryoverHours,
            max_balance_cap: 80,
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Error creating balance for user ${balance.user_id}:`, insertError);
          throw insertError;
        }

        // Log carryover in history
        if (carryoverHours > 0) {
          await supabase.from('time_off_accrual_history').insert({
            organization_id: balance.organization_id,
            user_id: balance.user_id,
            balance_id: newBalance.id,
            leave_type: 'sick',
            transaction_type: 'carryover',
            hours_change: carryoverHours,
            hours_before: 0,
            hours_after: carryoverHours,
            reason: `Year-end carryover from ${currentYear}. ${carryoverHours} hours carried over (max 40 hours per California law).`,
          });
        }

        // Log new frontload
        await supabase.from('time_off_accrual_history').insert({
          organization_id: balance.organization_id,
          user_id: balance.user_id,
          balance_id: newBalance.id,
          leave_type: 'sick',
          transaction_type: 'frontload',
          hours_change: newFrontloadHours,
          hours_before: carryoverHours,
          hours_after: nextYearTotal,
          reason: `${nextYear} annual frontload (California compliant - 40 hours). Total balance capped at ${nextYearTotal} hours.`,
        });

        results.push({
          userId: balance.user_id,
          carryoverHours,
          newTotal: nextYearTotal,
        });

        console.log(`Successfully processed user ${balance.user_id}`);
      } catch (error) {
        console.error(`Error processing balance ${balance.id}:`, error);
        // Continue processing other balances even if one fails
      }
    }

    console.log(`Successfully processed ${results.length} balances`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        message: `Processed year-end carryover for ${results.length} employees`,
        results: results,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in process-year-end-time-off:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
