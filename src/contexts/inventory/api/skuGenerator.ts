import { supabase } from '@/integrations/supabase/client';
import { InventoryCategory } from '../types';

/**
 * Generates a category prefix from category name
 * Converts category name to 3-4 letter uppercase prefix
 * Examples: "Food & Beverage" -> "FOOD", "Supplies" -> "SUPP", "Equipment" -> "EQUP"
 */
function generateCategoryPrefix(categoryName: string): string {
  // Remove special characters and split into words
  const words = categoryName
    .replace(/[^a-zA-Z\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 0);

  if (words.length === 0) return 'GEN';

  // If single word, take first 4 characters
  if (words.length === 1) {
    return words[0].substring(0, 4).toUpperCase();
  }

  // If multiple words, take first 2-3 characters from first two words
  if (words.length >= 2) {
    const firstWord = words[0].substring(0, 2);
    const secondWord = words[1].substring(0, 2);
    return (firstWord + secondWord).toUpperCase();
  }

  return words[0].substring(0, 4).toUpperCase();
}

/**
 * Generates a unique SKU using atomic database function
 * This prevents race conditions and ensures SKU uniqueness
 */
export async function generateSKU(
  categoryId?: string, 
  categories?: InventoryCategory[]
): Promise<string> {
  try {
    console.log('🎯 generateSKU called with:', { categoryId });
    
    // Get user's organization
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      throw new Error('Could not get user organization');
    }

    // Determine the category prefix
    let prefix = 'GEN'; // Default general prefix
    
    if (categoryId && categories) {
      const category = categories.find(cat => cat.id === categoryId);
      if (category) {
        prefix = generateCategoryPrefix(category.name);
        console.log(`📂 Found category "${category.name}" -> prefix: ${prefix}`);
      }
    }
    
    // Call the atomic database function to generate SKU
    console.log('🔄 Calling database function to generate SKU atomically');
    const { data, error } = await supabase
      .rpc('generate_next_sku', {
        p_organization_id: userData.organization_id,
        p_category_prefix: prefix
      });

    if (error) {
      console.error('❌ Error from database SKU generator:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Database function returned no SKU');
    }

    console.log(`✅ Generated SKU atomically: ${data}`);
    return data;
    
  } catch (error) {
    console.error('❌ Error generating SKU:', error);
    
    // Fallback: generate a timestamp-based SKU (should rarely happen)
    const timestamp = Date.now().toString().slice(-6);
    const fallbackSKU = `GEN-${timestamp}`;
    console.warn(`⚠️ Using fallback SKU: ${fallbackSKU}`);
    return fallbackSKU;
  }
}

/**
 * Validates that a SKU is unique (for manual SKU entry)
 */
export async function validateSKUUniqueness(
  sku: string, 
  excludeId?: string
): Promise<{ isUnique: boolean; message?: string }> {
  if (!sku || sku.trim() === '') {
    return { isUnique: true };
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      throw new Error('Could not get user organization');
    }

    let query = supabase
      .from('inventory_items')
      .select('id, name, sku')
      .eq('organization_id', userData.organization_id)
      .eq('sku', sku.trim())
      .eq('is_active', true);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data: existingItems, error } = await query;

    if (error) {
      console.error('Error validating SKU uniqueness:', error);
      return { 
        isUnique: false, 
        message: 'Unable to validate SKU uniqueness. Please try again.' 
      };
    }

    if (existingItems && existingItems.length > 0) {
      const existingItem = existingItems[0];
      return {
        isUnique: false,
        message: `SKU "${sku}" is already used by "${existingItem.name}"`
      };
    }
    
    return { isUnique: true };
  } catch (error) {
    console.error('Error validating SKU uniqueness:', error);
    return { 
      isUnique: false, 
      message: 'Unable to validate SKU uniqueness. Please try again.' 
    };
  }
}

/**
 * Gets SKU audit log for an item
 */
export async function getSKUAuditLog(itemId: string) {
  try {
    const { data, error } = await supabase
      .from('inventory_sku_audit')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching SKU audit log:', error);
    return [];
  }
}
