import { supabase } from '@/integrations/supabase/client';
import { InventoryTemplate, InventoryTemplateItem, TeamInventoryAssignment } from '../types';

export const inventoryTemplatesApi = {
  async getAll(): Promise<InventoryTemplate[]> {
    const { data, error } = await supabase
      .from('inventory_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return (data || []) as InventoryTemplate[];
  },

  async create(template: Omit<InventoryTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryTemplate> {
    const { data, error } = await supabase
      .from('inventory_templates')
      .insert([template])
      .select()
      .single();

    if (error) throw error;
    return data as InventoryTemplate;
  },

  async update(id: string, updates: Partial<InventoryTemplate>): Promise<InventoryTemplate> {
    const { data, error } = await supabase
      .from('inventory_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as InventoryTemplate;
  },

  async getTemplateItems(templateId: string): Promise<InventoryTemplateItem[]> {
    const { data, error } = await supabase
      .from('inventory_template_items')
      .select(`
        *,
        inventory_items(*)
      `)
      .eq('template_id', templateId)
      .order('sort_order');

    if (error) throw error;
    return (data || []) as InventoryTemplateItem[];
  },

  async addItemToTemplate(
    templateId: string, 
    itemId: string, 
    expectedQuantity: number = 0,
    sortOrder: number = 0
  ): Promise<InventoryTemplateItem> {
    const { data, error } = await supabase
      .from('inventory_template_items')
      .insert([{
        template_id: templateId,
        item_id: itemId,
        expected_quantity: expectedQuantity,
        sort_order: sortOrder
      }])
      .select()
      .single();

    if (error) throw error;
    return data as InventoryTemplateItem;
  },

  async removeItemFromTemplate(templateId: string, itemId: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_template_items')
      .delete()
      .eq('template_id', templateId)
      .eq('item_id', itemId);

    if (error) throw error;
  },

  async assignToTeam(templateId: string, teamId: string, assignedBy: string): Promise<TeamInventoryAssignment> {
    const { data, error } = await supabase
      .from('team_inventory_assignments')
      .insert([{
        template_id: templateId,
        team_id: teamId,
        assigned_by: assignedBy,
        organization_id: (await supabase.auth.getUser()).data.user?.user_metadata?.organization_id
      }])
      .select()
      .single();

    if (error) throw error;
    return data as TeamInventoryAssignment;
  },

  async getTeamAssignments(): Promise<TeamInventoryAssignment[]> {
    const { data, error } = await supabase
      .from('team_inventory_assignments')
      .select(`
        *,
        inventory_templates(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as TeamInventoryAssignment[];
  },

  async getTeamInventories(teamId: string): Promise<TeamInventoryAssignment[]> {
    const { data, error } = await supabase
      .from('team_inventory_assignments')
      .select(`
        *,
        inventory_templates(*)
      `)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as TeamInventoryAssignment[];
  },
};