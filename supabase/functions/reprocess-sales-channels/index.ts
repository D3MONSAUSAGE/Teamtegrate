import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReprocessRequest {
  startDate?: string;
  endDate?: string;
  teamId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify user is authenticated and is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !['admin', 'superadmin'].includes(userData.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { startDate, endDate, teamId }: ReprocessRequest = await req.json();

    console.log('Starting sales channel reprocessing...', { startDate, endDate, teamId });

    // Fetch sales data to reprocess
    let query = supabaseClient
      .from('sales_data')
      .select('*')
      .order('date', { ascending: true });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (teamId) query = query.eq('team_id', teamId);

    const { data: salesData, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching sales data:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch sales data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!salesData || salesData.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No sales data to reprocess',
        processedCount: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch active sales channels
    const { data: channels, error: channelsError } = await supabaseClient
      .from('sales_channels')
      .select('*')
      .eq('is_active', true);

    if (channelsError || !channels || channels.length === 0) {
      return new Response(JSON.stringify({ error: 'No active sales channels found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${salesData.length} sales records and ${channels.length} active channels`);

    let processedCount = 0;
    let errorCount = 0;
    let totalFeesGenerated = 0;
    const errors: string[] = [];

    // Process each sales record
    for (const sale of salesData) {
      try {
        // Delete existing channel transactions
        await supabaseClient
          .from('sales_channel_transactions')
          .delete()
          .eq('sales_data_id', sale.id);

        const rawData = sale.raw_data || {};
        const destinations = rawData.destinations || [];
        const tenders = rawData.tenders || [];
        const revenueItems = rawData.revenueItems || [];

        // Calculate totals for matching
        const destTotals = new Map();
        const tenderTotals = new Map();
        const revenueItemTotals = new Map();

        destinations.forEach((d: any) => {
          const name = (d.name || '').toLowerCase().trim();
          destTotals.set(name, (destTotals.get(name) || 0) + (Number(d.gross) || 0));
        });

        tenders.forEach((t: any) => {
          const name = (t.name || '').toLowerCase().trim();
          tenderTotals.set(name, (tenderTotals.get(name) || 0) + (Number(t.amount) || 0));
        });

        revenueItems.forEach((r: any) => {
          const name = (r.name || '').toLowerCase().trim();
          revenueItemTotals.set(name, (revenueItemTotals.get(name) || 0) + (Number(r.amount) || 0));
        });

        const newTransactions = [];

        for (const channel of channels) {
          // Skip if channel is team-specific and doesn't match
          if (channel.team_id && channel.team_id !== sale.team_id) {
            continue;
          }

          const channelName = channel.name.toLowerCase().trim();
          const channelKeywords = channelName.split(/\s+/);

          let gross = 0;

          // Check destinations
          for (const [destName, amount] of destTotals) {
            if (channelKeywords.some(kw => destName.includes(kw))) {
              gross += amount;
            }
          }

          // Check tenders
          for (const [tenderName, amount] of tenderTotals) {
            if (channelKeywords.some(kw => tenderName.includes(kw))) {
              gross += amount;
            }
          }

          // Check revenue items
          for (const [itemName, amount] of revenueItemTotals) {
            if (channelKeywords.some(kw => itemName.includes(kw))) {
              gross += amount;
            }
          }

          if (gross > 0) {
            const commissionFee =
              channel.commission_type === 'percentage'
                ? gross * channel.commission_rate
                : channel.flat_fee_amount || 0;

            const netSales = gross - commissionFee;

            newTransactions.push({
              organization_id: sale.organization_id,
              sales_data_id: sale.id,
              channel_id: channel.id,
              team_id: sale.team_id,
              date: sale.date,
              gross_sales: gross,
              commission_fee: commissionFee,
              net_sales: netSales,
              order_count: 0,
            });

            totalFeesGenerated += commissionFee;
          }
        }

        if (newTransactions.length > 0) {
          const { error: insertError } = await supabaseClient
            .from('sales_channel_transactions')
            .insert(newTransactions);

          if (insertError) {
            console.error(`Error inserting transactions for sale ${sale.id}:`, insertError);
            errors.push(`Sale ${sale.date}: Failed to create transactions`);
            errorCount++;
          } else {
            processedCount++;
          }
        } else {
          processedCount++;
        }
      } catch (error) {
        console.error(`Error processing sale ${sale.id}:`, error);
        errors.push(`Sale ${sale.date}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        errorCount++;
      }
    }

    console.log('Reprocessing complete:', { processedCount, errorCount, totalFeesGenerated });

    return new Response(JSON.stringify({
      success: errorCount < salesData.length,
      processedCount,
      errorCount,
      totalFeesGenerated,
      errors: errors.slice(0, 10), // Limit error messages
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in reprocess-sales-channels:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
