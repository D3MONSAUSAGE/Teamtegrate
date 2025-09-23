import { inventoryItemsApi } from '@/contexts/inventory/api/inventoryItems';
import { InventoryCategory } from '@/contexts/inventory/types';

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
 * Finds the next available sequential number for a given SKU prefix
 */
async function findNextSequentialNumber(prefix: string): Promise<number> {
  try {
    // Get all items to check existing SKUs
    const items = await inventoryItemsApi.getAll();
    
    // Filter items with SKUs that start with the prefix
    const pattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-?(\\d+)$`, 'i');
    
    let maxNumber = 0;
    
    items.forEach(item => {
      if (item.sku) {
        const match = item.sku.match(pattern);
        if (match) {
          const number = parseInt(match[1], 10);
          if (number > maxNumber) {
            maxNumber = number;
          }
        }
      }
    });

    return maxNumber + 1;
  } catch (error) {
    console.error('Error finding next sequential number:', error);
    // If there's an error, start from 1
    return 1;
  }
}

/**
 * Checks if a SKU already exists in the system
 */
export async function validateSKUUniqueness(sku: string, excludeId?: string): Promise<{ isUnique: boolean; message?: string }> {
  if (!sku || sku.trim() === '') {
    return { isUnique: true };
  }

  try {
    const items = await inventoryItemsApi.getAll();
    
    const existingItem = items.find(item => 
      item.sku?.toLowerCase() === sku.toLowerCase() && 
      (!excludeId || item.id !== excludeId)
    );
    
    if (existingItem) {
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
 * Generates a unique SKU for an inventory item
 */
export async function generateSKU(
  categoryId?: string, 
  categories?: InventoryCategory[],
  excludeId?: string
): Promise<string> {
  try {
    // Determine the category prefix
    let prefix = 'GEN'; // Default general prefix
    
    if (categoryId && categories) {
      const category = categories.find(cat => cat.id === categoryId);
      if (category) {
        prefix = generateCategoryPrefix(category.name);
      }
    }
    
    // Find the next sequential number
    const nextNumber = await findNextSequentialNumber(prefix);
    
    // Format with leading zeros (3 digits)
    const formattedNumber = nextNumber.toString().padStart(3, '0');
    
    // Generate the SKU
    let generatedSKU = `${prefix}-${formattedNumber}`;
    
    // Ensure uniqueness (in case of edge cases or concurrent access)
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
      const validation = await validateSKUUniqueness(generatedSKU, excludeId);
      if (validation.isUnique) {
        return generatedSKU;
      }
      
      // If not unique, try next number
      attempts++;
      const nextAttemptNumber = nextNumber + attempts;
      const nextFormattedNumber = nextAttemptNumber.toString().padStart(3, '0');
      generatedSKU = `${prefix}-${nextFormattedNumber}`;
    }
    
    // If we can't find a unique SKU after many attempts, add timestamp
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}-${timestamp}`;
    
  } catch (error) {
    console.error('Error generating SKU:', error);
    
    // Fallback: generate a simple timestamp-based SKU
    const timestamp = Date.now().toString().slice(-6);
    return `GEN-${timestamp}`;
  }
}

/**
 * Suggests SKU patterns based on existing inventory
 */
export async function getSKUPatterns(): Promise<{ prefix: string; count: number; example: string }[]> {
  try {
    const items = await inventoryItemsApi.getAll();
    const patterns = new Map<string, { count: number; example: string }>();
    
    items.forEach(item => {
      if (item.sku) {
        const match = item.sku.match(/^([A-Z]{2,4})-?\d+$/i);
        if (match) {
          const prefix = match[1].toUpperCase();
          const current = patterns.get(prefix) || { count: 0, example: '' };
          patterns.set(prefix, {
            count: current.count + 1,
            example: current.example || item.sku
          });
        }
      }
    });
    
    return Array.from(patterns.entries())
      .map(([prefix, data]) => ({
        prefix,
        count: data.count,
        example: data.example
      }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error getting SKU patterns:', error);
    return [];
  }
}