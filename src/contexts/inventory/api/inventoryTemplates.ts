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
    return (data || []).map((item: any) => ({
      ...item,
      updated_at: item.updated_at || item.created_at || new Date().toISOString()
    })) as InventoryTemplateItem[];
  },

  async addItemToTemplate(
    templateId: string, 
    itemId: string, 
    inStockQuantity: number = 0,
    minimumQuantity?: number,
    maximumQuantity?: number,
    sortOrder: number = 0
  ): Promise<InventoryTemplateItem> {
    try {
      const { data, error } = await supabase
        .from('inventory_template_items')
        .insert([{
          template_id: templateId,
          item_id: itemId,
          in_stock_quantity: inStockQuantity,
          minimum_quantity: minimumQuantity,
          maximum_quantity: maximumQuantity,
          sort_order: sortOrder
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding item to template:', error);
        
        // Provide better error messages for common issues
        if (error.code === 'PGRST301') {
          throw new Error('You do not have permission to add items to this template. Please contact your administrator.');
        }
        
        if (error.message?.includes('violates row-level security')) {
          throw new Error('Permission denied: You cannot add items to this template.');
        }
        
        if (error.message?.includes('duplicate key')) {
          throw new Error('This item is already in the template.');
        }
        
        throw new Error(`Failed to add item to template: ${error.message}`);
      }
      
      return data as InventoryTemplateItem;
    } catch (error: any) {
      console.error('Template item creation error:', error);
      throw error;
    }
  },

  async removeItemFromTemplate(templateId: string, itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('inventory_template_items')
        .delete()
        .eq('template_id', templateId)
        .eq('item_id', itemId);

      if (error) {
        console.error('Error removing item from template:', error);
        
        if (error.code === 'PGRST301' || error.message?.includes('violates row-level security')) {
          throw new Error('Permission denied: You cannot remove items from this template.');
        }
        
        throw new Error(`Failed to remove item from template: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Template item removal error:', error);
      throw error;
    }
  },

  async updateTemplateItem(
    templateId: string, 
    itemId: string, 
    updates: {
      in_stock_quantity?: number;
      minimum_quantity?: number;
      maximum_quantity?: number;
      sort_order?: number;
    }
  ): Promise<InventoryTemplateItem> {
    try {
      const { data, error } = await supabase
        .from('inventory_template_items')
        .update(updates)
        .eq('template_id', templateId)
        .eq('item_id', itemId)
        .select()
        .single();

      if (error) {
        console.error('Error updating template item:', error);
        
        if (error.code === 'PGRST301' || error.message?.includes('violates row-level security')) {
          throw new Error('Permission denied: You cannot modify this template item.');
        }
        
        throw new Error(`Failed to update template item: ${error.message}`);
      }
      
      return data as InventoryTemplateItem;
    } catch (error: any) {
      console.error('Template item update error:', error);
      throw error;
    }
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