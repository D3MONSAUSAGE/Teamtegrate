import { supabase } from '@/integrations/supabase/client';
import { TeamItemPricing } from '../types';

export const teamItemPricingApi = {
  /**
   * Get all team-specific pricing for the current user's organization
   */
  async getAll(): Promise<TeamItemPricing[]> {
    const { data, error } = await supabase
      .from('team_item_pricing')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get team-specific pricing for a specific team and item
   */
  async getByTeamAndItem(teamId: string, itemId: string): Promise<TeamItemPricing | null> {
    const { data, error } = await supabase
      .from('team_item_pricing')
      .select('*')
      .eq('team_id', teamId)
      .eq('item_id', itemId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Get all team-specific pricing for a specific item
   */
  async getByItem(itemId: string): Promise<TeamItemPricing[]> {
    const { data, error } = await supabase
      .from('team_item_pricing')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get all team-specific pricing for a specific team
   */
  async getByTeam(teamId: string): Promise<TeamItemPricing[]> {
    const { data, error } = await supabase
      .from('team_item_pricing')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create or update team-specific pricing (upsert)
   */
  async upsert(pricing: Omit<TeamItemPricing, 'id' | 'created_at' | 'updated_at' | 'organization_id' | 'created_by'>): Promise<TeamItemPricing> {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) throw new Error('Not authenticated');

    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.user.id)
      .single();

    if (userDataError || !userData) throw new Error('Could not get user data');

    // Check if pricing already exists
    const existing = await teamItemPricingApi.getByTeamAndItem(pricing.team_id, pricing.item_id);

    if (existing) {
      // Update existing pricing
      const { data, error } = await supabase
        .from('team_item_pricing')
        .update({
          purchase_price: pricing.purchase_price,
          sale_price: pricing.sale_price,
          unit_cost: pricing.unit_cost,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new pricing
      const { data, error } = await supabase
        .from('team_item_pricing')
        .insert([{
          ...pricing,
          organization_id: userData.organization_id,
          created_by: user.user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  /**
   * Delete team-specific pricing (revert to global pricing)
   */
  async delete(teamId: string, itemId: string): Promise<void> {
    const { error } = await supabase
      .from('team_item_pricing')
      .delete()
      .eq('team_id', teamId)
      .eq('item_id', itemId);

    if (error) throw error;
  },

  /**
   * Get effective pricing for an item (team-specific or fallback to global)
   */
  async getEffectivePricing(itemId: string, teamId?: string): Promise<{
    purchase_price?: number;
    sale_price?: number;
    unit_cost?: number;
    isTeamSpecific: boolean;
  }> {
    // Get the item's global pricing
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select('purchase_price, sale_price, unit_cost')
      .eq('id', itemId)
      .single();

    if (itemError) throw itemError;

    // If no team specified, return global pricing
    if (!teamId) {
      return {
        purchase_price: item.purchase_price || undefined,
        sale_price: item.sale_price || undefined,
        unit_cost: item.unit_cost || undefined,
        isTeamSpecific: false,
      };
    }

    // Check for team-specific pricing
    const teamPricing = await teamItemPricingApi.getByTeamAndItem(teamId, itemId);

    if (teamPricing) {
      return {
        purchase_price: teamPricing.purchase_price || item.purchase_price || undefined,
        sale_price: teamPricing.sale_price || item.sale_price || undefined,
        unit_cost: teamPricing.unit_cost || item.unit_cost || undefined,
        isTeamSpecific: true,
      };
    }

    // Fallback to global pricing
    return {
      purchase_price: item.purchase_price || undefined,
      sale_price: item.sale_price || undefined,
      unit_cost: item.unit_cost || undefined,
      isTeamSpecific: false,
    };
  },
};
