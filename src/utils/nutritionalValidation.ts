import { z } from 'zod';

// Simple helpers for basic data conversion
export const keepZeroOrNull = <T>(value: T): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) || !isFinite(num) ? null : num;
};

export const toArray = (raw?: string | string[]): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(item => item && item.trim().length > 0);
  return raw.split(',').map(item => item.trim()).filter(item => item.length > 0);
};

export const toText = (arr: string[]): string => arr.join(', ');

// Simple validation schemas - no complex nested structures
export const nutritionalSchema = z.object({
  serving_size: z.string().optional(),
  servings_per_container: z.number().min(0).max(100).optional(),
  calories: z.number().min(0).max(5000).optional(),
  total_fat: z.number().min(0).max(500).optional(),
  saturated_fat: z.number().min(0).max(500).optional(),
  sodium: z.number().min(0).max(10000).optional(),
  total_carbohydrates: z.number().min(0).max(500).optional(),
  protein: z.number().min(0).max(500).optional(),
});

export const ingredientsSchema = z.object({
  ingredients: z.string().optional(),
  allergens: z.array(z.string()).optional(),
});

// Simple payload builder - no complex transformations
export const buildNutritionPayload = (form: any, itemId: string, user: { organization_id?: string; id?: string } | null) => {
  if (!user?.organization_id || !user?.id) {
    throw new Error('User organization or ID not found');
  }

  return {
    item_id: itemId,
    organization_id: user.organization_id,
    created_by: user.id,
    ...form
  };
};

// Simplified data checker - handles simple flat structure only
export const hasNutritionOrIngredients = (nutritionalData: any, ingredientsData: any): boolean => {
  console.log('🔍 Simple nutrition check:', { 
    hasNutrition: !!nutritionalData,
    hasIngredients: !!ingredientsData 
  });

  // Check ingredients
  if (ingredientsData?.ingredients?.trim()) return true;
  if (ingredientsData?.allergens?.length > 0) return true;
  
  if (!nutritionalData) return false;
  
  // Check basic nutritional fields
  const hasServingSize = nutritionalData?.serving_size?.trim();
  const hasCalories = nutritionalData?.calories !== null && nutritionalData?.calories !== undefined && nutritionalData?.calories !== '';
  const hasFat = nutritionalData?.total_fat !== null && nutritionalData?.total_fat !== undefined && nutritionalData?.total_fat !== '';
  const hasProtein = nutritionalData?.protein !== null && nutritionalData?.protein !== undefined && nutritionalData?.protein !== '';
  
  return !!(hasServingSize || hasCalories || hasFat || hasProtein);
};

// Simple filename sanitizer
export const sanitizeFilename = (filename: string = 'label'): string => {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
};