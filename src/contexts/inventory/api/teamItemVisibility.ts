import { supabase } from '@/integrations/supabase/client';
import { TeamItemVisibility } from '../types';

export const teamItemVisibilityApi = {
  async getAll(): Promise<TeamItemVisibility[]> {
    const { data, error } = await supabase
      .from('team_item_visibility')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByTeam(teamId: string): Promise<TeamItemVisibility[]> {
    const { data, error } = await supabase
      .from('team_item_visibility')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByItem(itemId: string): Promise<TeamItemVisibility[]> {
    const { data, error } = await supabase
      .from('team_item_visibility')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async hideItem(teamId: string, itemId: string, organizationId: string, userId: string): Promise<TeamItemVisibility> {
    const { data, error } = await supabase
      .from('team_item_visibility')
      .upsert({
        team_id: teamId,
        item_id: itemId,
        organization_id: organizationId,
        is_hidden: true,
        hidden_at: new Date().toISOString(),
        hidden_by: userId
      }, {
        onConflict: 'team_id,item_id'
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to hide item');
    return data;
  },

  async showItem(teamId: string, itemId: string, organizationId: string): Promise<TeamItemVisibility> {
    const { data, error } = await supabase
      .from('team_item_visibility')
      .upsert({
        team_id: teamId,
        item_id: itemId,
        organization_id: organizationId,
        is_hidden: false,
        hidden_at: null,
        hidden_by: null
      }, {
        onConflict: 'team_id,item_id'
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to show item');
    return data;
  },

  async delete(teamId: string, itemId: string): Promise<void> {
    const { error } = await supabase
      .from('team_item_visibility')
      .delete()
      .eq('team_id', teamId)
      .eq('item_id', itemId);

    if (error) throw error;
  },

  async isItemVisible(teamId: string, itemId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('team_item_visibility')
      .select('is_hidden')
      .eq('team_id', teamId)
      .eq('item_id', itemId)
      .maybeSingle();

    if (error) throw error;
    // If no record exists, item is visible by default
    if (!data) return true;
    return !data.is_hidden;
  }
};
