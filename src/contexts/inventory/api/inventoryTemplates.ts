import { supabase } from '@/integrations/supabase/client';
import { InventoryTemplate, InventoryTemplateItem, TeamInventoryAssignment } from '../types';

export const inventoryTemplatesApi = {
  async getAll(): Promise<InventoryTemplate[]> {
    const { data, error } = await supabase
      .from('inventory_templates')
      .select(`
        *,
        inventory_template_items(count)
      `)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    
    // Transform data to include item count
    return (data || []).map((template: any) => ({
      ...template,
      item_count: template.inventory_template_items?.[0]?.count || 0
    })) as InventoryTemplate[];
  },

  async getAllTemplateItems(): Promise<InventoryTemplateItem[]> {
    const { data, error } = await supabase
      .from('inventory_template_items')
      .select(`
        *,
        inventory_items(*),
        inventory_templates!inner(*)
      `)
      .eq('inventory_templates.is_active', true)
      .order('sort_order');

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      updated_at: item.updated_at || item.created_at || new Date().toISOString()
    })) as InventoryTemplateItem[];
  },

  async create(template: Omit<InventoryTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryTemplate> {
    const { data, error } = await supabase
      .from('inventory_templates')
      .insert([template])
      .select()
      .single();

    if (error) throw error;
    
    // Note: If template.team_id is NULL (All Teams), the database trigger will automatically
    // create team_inventory_assignments for all teams in the organization
    
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
    return (data || []).map((item: any) => ({
      ...item,
      updated_at: item.updated_at || item.created_at || new Date().toISOString()
    })) as InventoryTemplateItem[];
  },

  async addItemToTemplate(
    templateId: string, 
    itemId: string, 
    inStockQuantity: number = 0,
    sortOrder: number = 0
  ): Promise<InventoryTemplateItem> {
    const { data, error } = await supabase
      .from('inventory_template_items')
      .insert([{
        template_id: templateId,
        item_id: itemId,
        in_stock_quantity: inStockQuantity,
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

  async updateTemplateItem(
    templateId: string, 
    itemId: string, 
    updates: {
      in_stock_quantity?: number;
      sort_order?: number;
    }
  ): Promise<InventoryTemplateItem> {
    const { data, error } = await supabase
      .from('inventory_template_items')
      .update(updates)
      .eq('template_id', templateId)
      .eq('item_id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data as InventoryTemplateItem;
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

  async duplicate(templateId: string, newName?: string): Promise<InventoryTemplate> {
    // First get the original template
    const { data: originalTemplate, error: fetchError } = await supabase
      .from('inventory_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (fetchError) throw fetchError;

    // Create new template with modified name
    const { data: newTemplate, error: createError } = await supabase
      .from('inventory_templates')
      .insert([{
        ...originalTemplate,
        id: undefined,
        name: newName || `${originalTemplate.name} (Copy)`,
        created_at: undefined,
        updated_at: undefined,
      }])
      .select()
      .single();

    if (createError) throw createError;

    // Copy all template items
    const { data: templateItems, error: itemsError } = await supabase
      .from('inventory_template_items')
      .select('*')
      .eq('template_id', templateId);

    if (itemsError) throw itemsError;

    if (templateItems && templateItems.length > 0) {
      const newTemplateItems = templateItems.map(item => ({
        ...item,
        id: undefined,
        template_id: newTemplate.id,
      }));

      const { error: insertItemsError } = await supabase
        .from('inventory_template_items')
        .insert(newTemplateItems);

      if (insertItemsError) throw insertItemsError;
    }

    return newTemplate as InventoryTemplate;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_templates')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },
};