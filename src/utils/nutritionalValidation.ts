import { z } from 'zod';

// Shared validation helpers to prevent zero-killer bugs
export const keepZeroOrNull = <T>(value: T): number | null => {
  // Handle the case where value is 0 or '0' (which should be preserved)
  if (value === 0 || value === '0') return Number(value);
  
  // Handle empty/null/undefined
  if (value === '' || value === null || value === undefined) return null;
  
  // Convert to number and validate
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export const toArray = (raw?: string | string[]): string[] => {
  if (Array.isArray(raw)) return raw.map(x => x.trim()).filter(Boolean);
  if (typeof raw === 'string') {
    return raw
      .split(/[,\n]/g)
      .map(x => x.trim())
      .filter(Boolean);
  }
  return [];
};

export const toText = (arr: string[]): string => arr.join(', ');

// Nutritional data validation schema with realistic bounds
export const nutritionalSchema = z.object({
  serving_size: z.string().max(50).optional(),
  servings_per_container: z.coerce.number().min(0).max(1000).optional().nullable(),
  calories: z.coerce.number().min(0).max(2000).optional().nullable(),
  total_fat: z.coerce.number().min(0).max(200).optional().nullable(),
  saturated_fat: z.coerce.number().min(0).max(100).optional().nullable(),
  trans_fat: z.coerce.number().min(0).max(50).optional().nullable(),
  cholesterol: z.coerce.number().min(0).max(1000).optional().nullable(),
  sodium: z.coerce.number().min(0).max(5000).optional().nullable(),
  total_carbohydrates: z.coerce.number().min(0).max(300).optional().nullable(),
  dietary_fiber: z.coerce.number().min(0).max(100).optional().nullable(),
  total_sugars: z.coerce.number().min(0).max(200).optional().nullable(),
  added_sugars: z.coerce.number().min(0).max(200).optional().nullable(),
  protein: z.coerce.number().min(0).max(150).optional().nullable(),
  vitamin_d: z.coerce.number().min(0).max(100).optional().nullable(),
  calcium: z.coerce.number().min(0).max(2000).optional().nullable(),
  iron: z.coerce.number().min(0).max(100).optional().nullable(),
  potassium: z.coerce.number().min(0).max(5000).optional().nullable(),
}).partial();

export const ingredientsSchema = z.object({
  ingredients: z.string().max(2000).optional(),
  allergens: z.array(z.string()).max(20).optional(),
});

// Build nutritional payload with proper organization and user context
export const buildNutritionPayload = (form: any, itemId: string, user: { organization_id?: string; id?: string } | null) => {
  const ingredientsArr = toArray(form.allergens);

  return {
    item_id: itemId,
    organization_id: user?.organization_id ?? null,
    created_by: user?.id ?? null,
    serving_size: form.serving_size?.trim() || null,
    servings_per_container: keepZeroOrNull(form.servings_per_container),
    calories: keepZeroOrNull(form.calories),
    total_fat: keepZeroOrNull(form.total_fat),
    saturated_fat: keepZeroOrNull(form.saturated_fat),
    trans_fat: keepZeroOrNull(form.trans_fat),
    cholesterol: keepZeroOrNull(form.cholesterol),
    sodium: keepZeroOrNull(form.sodium),
    total_carbohydrates: keepZeroOrNull(form.total_carbohydrates),
    dietary_fiber: keepZeroOrNull(form.dietary_fiber),
    total_sugars: keepZeroOrNull(form.total_sugars),
    added_sugars: keepZeroOrNull(form.added_sugars),
    protein: keepZeroOrNull(form.protein),
    vitamin_d: keepZeroOrNull(form.vitamin_d),
    calcium: keepZeroOrNull(form.calcium),
    iron: keepZeroOrNull(form.iron),
    potassium: keepZeroOrNull(form.potassium),
    ingredients: form.ingredients?.trim() || null,
    allergens: ingredientsArr.length ? ingredientsArr : null,
    additional_nutrients: Object.keys(form.additional_nutrients || {}).length > 0 ? form.additional_nutrients : null,
    updated_at: new Date().toISOString()
  };
};

// Helper to check if we have nutrition or ingredients data
export const hasNutritionOrIngredients = (nutritionalData: any, ingredientsData: any): boolean => {
  // Check ingredients
  if (ingredientsData?.ingredients?.trim()) return true;
  if (ingredientsData?.allergens?.length > 0) return true;
  
  // Check nutrition - including serving size as meaningful data
  if (nutritionalData?.serving_size?.trim()) return true;
  
  // Check other nutritional values (allowing 0 as valid)
  const nutritionalFields = [
    'servings_per_container', 'calories', 'total_fat', 'saturated_fat', 
    'trans_fat', 'cholesterol', 'sodium', 'total_carbohydrates', 
    'dietary_fiber', 'total_sugars', 'added_sugars', 'protein', 
    'vitamin_d', 'calcium', 'iron', 'potassium'
  ];
  
  return nutritionalFields.some(field => {
    const val = nutritionalData?.[field];
    return val !== null && val !== undefined && val !== '';
  });
};

// Sanitize filename for PDF downloads
export const sanitizeFilename = (filename: string = 'label'): string => {
  return filename
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\-_. ]/gi, '-')
    .toLowerCase();
};