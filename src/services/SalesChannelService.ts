import { supabase } from '@/integrations/supabase/client';

export class SalesChannelService {
  static async syncChannelTransactionsForSalesData(
    salesDataId: string,
    insertData: any,
    organizationId: string
  ) {
    try {
      const teamId: string | null = insertData.team_id || null;
      const date: string = insertData.date;
      const location: string = insertData.location;
      const raw = insertData.raw_data || {};

      // 1) Fetch active channels for this org (and team if specified)
      let query = supabase
        .from('sales_channels')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      const { data: channels, error: channelErr } = await query;
      if (channelErr) throw channelErr;

      if (!channels || channels.length === 0) {
        // Nothing to sync
        return;
      }

      // 2) Pre-compute section totals by name (case-insensitive)
      const norm = (s: string) => (s || '').trim().toLowerCase();
      const sumByName = (arr: any[] = []) => {
        const map = new Map<string, { total: number; quantity: number }>();
        arr.forEach((e) => {
          const key = norm(e.name);
          const prev = map.get(key) || { total: 0, quantity: 0 };
          map.set(key, {
            total: prev.total + Number(e.total || 0),
            quantity: prev.quantity + Number(e.quantity || 0)
          });
        });
        return map;
      };

      const destinationsMap = sumByName(raw.destinations);
      const tendersMap = sumByName(raw.tenders);
      const revenueItemsMap = sumByName(raw.revenueItems);

      // 3) Build transactions from best match source
      const txns = [] as any[];
      for (const ch of channels) {
        // If channel is team-scoped, skip when not matching this team
        if (ch.team_id && teamId && ch.team_id !== teamId) continue;
        if (ch.team_id && !teamId) continue; // sales data is for a specific team; skip mismatched

        const key = norm(ch.name);
        const dest = destinationsMap.get(key);
        const tender = tendersMap.get(key);
        const rev = revenueItemsMap.get(key);

        const gross = (dest?.total || 0) || (tender?.total || 0) || (rev?.total || 0);
        const qty = (dest?.quantity || 0) || (tender?.quantity || 0) || (rev?.quantity || 0);

        if (gross > 0) {
          let commission = 0;
          if (ch.commission_type === 'percentage') {
            commission = Number((gross * Number(ch.commission_rate || 0)).toFixed(2));
          } else if (ch.commission_type === 'flat_fee') {
            commission = Number(Number(ch.flat_fee_amount || 0).toFixed(2));
          }

          txns.push({
            organization_id: organizationId,
            sales_data_id: salesDataId,
            channel_id: ch.id,
            team_id: teamId,
            location: location,
            date: date,
            gross_sales: Number(gross.toFixed(2)),
            commission_fee: commission,
            net_sales: Number((gross - commission).toFixed(2)),
            order_count: qty || null
          });
        }
      }

      // 4) Replace existing transactions for this sales_data_id
      await supabase
        .from('sales_channel_transactions')
        .delete()
        .eq('sales_data_id', salesDataId)
        .eq('organization_id', organizationId);

      if (txns.length > 0) {
        const { error: insErr } = await supabase
          .from('sales_channel_transactions')
          .insert(txns);
        if (insErr) throw insErr;
      }
    } catch (err) {
      console.error('[SalesChannelService] Failed to sync channel transactions:', err);
      throw err;
    }
  }
}

export const SalesChannelServiceSingleton = SalesChannelService;
