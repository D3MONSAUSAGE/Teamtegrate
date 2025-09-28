import { supabase } from '@/integrations/supabase/client';

export interface WarehouseItemSetting {
  id: string;
  organization_id: string;
  warehouse_id: string;
  item_id: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  reorder_min: number;
  reorder_max: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DayOfWeekSettings {
  [day: number]: {
    reorder_min: number;
    reorder_max: number;
  };
}

export interface ItemDailySettings {
  item_id: string;
  item_name?: string;
  item_sku?: string;
  current_stock?: number;
  days: DayOfWeekSettings;
}

export class WarehouseSettingsApi {
  
  // Get all settings for a warehouse
  async getWarehouseSettings(warehouseId: string): Promise<WarehouseItemSetting[]> {
    const { data, error } = await supabase
      .from('warehouse_item_settings')
      .select('*')
      .eq('warehouse_id', warehouseId)
      .eq('is_active', true)
      .order('item_id', { ascending: true })
      .order('day_of_week', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get settings for a specific item across all days
  async getItemSettings(warehouseId: string, itemId: string): Promise<WarehouseItemSetting[]> {
    const { data, error } = await supabase
      .from('warehouse_item_settings')
      .select('*')
      .eq('warehouse_id', warehouseId)
      .eq('item_id', itemId)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get current day's reorder levels for an item
  async getCurrentReorderLevels(warehouseId: string, itemId: string, date?: Date): Promise<{reorder_min: number, reorder_max: number}> {
    const targetDate = date || new Date();
    
    const { data, error } = await supabase.rpc('get_item_reorder_levels', {
      p_warehouse_id: warehouseId,
      p_item_id: itemId,
      p_date: targetDate.toISOString().split('T')[0]
    });

    if (error) throw error;
    return data && data.length > 0 ? data[0] : { reorder_min: 0, reorder_max: 100 };
  }

  // Set settings for an item on a specific day
  async setItemDaySettings(
    warehouseId: string,
    itemId: string,
    dayOfWeek: number,
    reorderMin: number,
    reorderMax: number
  ): Promise<WarehouseItemSetting> {
    // First try to update existing setting
    const { data: existing } = await supabase
      .from('warehouse_item_settings')
      .select('id')
      .eq('warehouse_id', warehouseId)
      .eq('item_id', itemId)
      .eq('day_of_week', dayOfWeek)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('warehouse_item_settings')
        .update({
          reorder_min: reorderMin,
          reorder_max: reorderMax,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('warehouse_item_settings')
        .insert({
          warehouse_id: warehouseId,
          item_id: itemId,
          day_of_week: dayOfWeek,
          reorder_min: reorderMin,
          reorder_max: reorderMax,
          organization_id: (await this.getCurrentUserOrganization()),
          created_by: (await supabase.auth.getUser()).data.user?.id || ''
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  // Bulk set settings for an item across multiple days
  async setItemWeeklySettings(
    warehouseId: string,
    itemId: string,
    weeklySettings: DayOfWeekSettings
  ): Promise<WarehouseItemSetting[]> {
    const results: WarehouseItemSetting[] = [];
    
    for (const [dayStr, settings] of Object.entries(weeklySettings)) {
      const day = parseInt(dayStr);
      if (day >= 0 && day <= 6) {
        const result = await this.setItemDaySettings(
          warehouseId,
          itemId,
          day,
          settings.reorder_min,
          settings.reorder_max
        );
        results.push(result);
      }
    }
    
    return results;
  }

  // Copy settings from one day to another
  async copyDaySettings(
    warehouseId: string,
    fromDay: number,
    toDay: number
  ): Promise<void> {
    const { data: settings, error: fetchError } = await supabase
      .from('warehouse_item_settings')
      .select('item_id, reorder_min, reorder_max')
      .eq('warehouse_id', warehouseId)
      .eq('day_of_week', fromDay)
      .eq('is_active', true);

    if (fetchError) throw fetchError;
    if (!settings || settings.length === 0) return;

    for (const setting of settings) {
      await this.setItemDaySettings(
        warehouseId,
        setting.item_id,
        toDay,
        setting.reorder_min,
        setting.reorder_max
      );
    }
  }

  // Delete settings for an item on a specific day
  async deleteItemDaySettings(warehouseId: string, itemId: string, dayOfWeek: number): Promise<void> {
    const { error } = await supabase
      .from('warehouse_item_settings')
      .update({ is_active: false })
      .eq('warehouse_id', warehouseId)
      .eq('item_id', itemId)
      .eq('day_of_week', dayOfWeek);

    if (error) throw error;
  }

  // Get aggregated view of items with their daily settings
  async getItemsDailySettings(warehouseId: string): Promise<ItemDailySettings[]> {
    // Get warehouse items with inventory details
    const { data: warehouseItems, error: warehouseItemsError } = await supabase
      .from('warehouse_items')
      .select(`
        item_id,
        on_hand,
        inventory_items!inner(
          id,
          name,
          sku
        )
      `)
      .eq('warehouse_id', warehouseId);

    if (warehouseItemsError) throw warehouseItemsError;

    // Then get all settings
    const settings = await this.getWarehouseSettings(warehouseId);

    // Combine the data
    const result: ItemDailySettings[] = [];
    
    for (const warehouseItem of warehouseItems || []) {
      const itemSettings = settings.filter(s => s.item_id === warehouseItem.item_id);
      const days: DayOfWeekSettings = {};

      // Initialize all days with defaults
      for (let day = 0; day <= 6; day++) {
        const daySetting = itemSettings.find(s => s.day_of_week === day);
        days[day] = {
          reorder_min: daySetting?.reorder_min || 0,
          reorder_max: daySetting?.reorder_max || 100
        };
      }

      const inventoryItem = warehouseItem.inventory_items as any;
      
      result.push({
        item_id: warehouseItem.item_id,
        item_name: inventoryItem?.name,
        item_sku: inventoryItem?.sku,
        current_stock: Number(warehouseItem.on_hand) || 0,
        days
      });
    }

    return result;
  }

  private async getCurrentUserOrganization(): Promise<string> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('No authenticated user');
    
    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.user.id)
      .single();
      
    if (!profile?.organization_id) throw new Error('No organization found for user');
    return profile.organization_id;
  }
}

export const warehouseSettingsApi = new WarehouseSettingsApi();