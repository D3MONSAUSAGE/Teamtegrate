import { supabase } from '@/integrations/supabase/client';

export interface LabelTemplate {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  category: string;
  template_data: any;
  dimensions: any;
  printer_type: string;
  is_default: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LabelField {
  id?: string;
  type: 'text' | 'barcode' | 'qr' | 'image' | 'line' | 'rectangle' | 'nutritional_facts' | 'ingredients_list' | 'allergen_warning' | 'lot_expiration' | 'multiline_text';
  field: string; // The data field to display (e.g., 'name', 'sku', 'lot_number')
  x: number; // Position from left in points
  y: number; // Position from top in points
  width?: number;
  height?: number;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontFamily?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  format?: string; // For barcodes: CODE128, CODE39, EAN13, etc.
  rotation?: number;
  size?: number; // For QR codes
  maxLines?: number; // For multi-line text
  lineHeight?: number; // For multi-line text
  wordWrap?: boolean; // For ingredients list
  highlightAllergens?: boolean; // For allergen warnings
  dateFormat?: string; // For lot expiration dates
}

export const labelTemplatesApi = {
  async getAll(): Promise<LabelTemplate[]> {
    const { data, error } = await supabase
      .from('label_templates')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as LabelTemplate[];
  },

  async getByCategory(category: string): Promise<LabelTemplate[]> {
    const { data, error } = await supabase
      .from('label_templates')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as LabelTemplate[];
  },

  async getById(id: string): Promise<LabelTemplate | null> {
    const { data, error } = await supabase
      .from('label_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return (data || null) as LabelTemplate | null;
  },

  async create(template: Omit<LabelTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<LabelTemplate> {
    const { data, error } = await supabase
      .from('label_templates')
      .insert([template as any])
      .select()
      .single();

    if (error) throw error;
    return data as LabelTemplate;
  },

  async update(id: string, updates: Partial<LabelTemplate>): Promise<LabelTemplate> {
    const { data, error } = await supabase
      .from('label_templates')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as LabelTemplate;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('label_templates')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  async getDefaults(): Promise<LabelTemplate[]> {
    const { data, error } = await supabase
      .from('label_templates')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) throw error;
    return (data || []) as LabelTemplate[];
  },

  // Create default food product template
  async createDefaultFoodTemplate(organizationId: string, createdBy: string): Promise<LabelTemplate> {
    const foodTemplate = {
      organization_id: organizationId,
      created_by: createdBy,
      name: 'Comprehensive Food Label',
      description: 'Complete food label with nutrition facts, ingredients, allergens, and lot tracking',
      category: 'food_product',
      printer_type: 'thermal',
      is_default: true,
      is_active: true,
      dimensions: {
        width: 4,
        height: 6,
        unit: 'inches'
      },
      template_data: {
        fields: [
          // Product name (large, bold)
          {
            type: 'text',
            field: 'name',
            x: 20,
            y: 30,
            fontSize: 16,
            fontWeight: 'bold',
            align: 'center',
            width: 250
          },
          // SKU and Barcode
          {
            type: 'text',
            field: 'sku',
            x: 20,
            y: 60,
            fontSize: 10,
            fontWeight: 'normal'
          },
          {
            type: 'barcode',
            field: 'sku',
            x: 20,
            y: 75,
            format: 'CODE128',
            width: 150,
            height: 30
          },
          // QR Code (optional, compact)
          {
            type: 'qr',
            field: 'product_url',
            x: 200,
            y: 75,
            size: 40
          },
          // Lot and Expiration
          {
            type: 'lot_expiration',
            field: 'lot_info',
            x: 20,
            y: 130,
            fontSize: 9,
            fontWeight: 'bold'
          },
          // Nutritional Facts
          {
            type: 'nutritional_facts',
            field: 'nutritional_info',
            x: 20,
            y: 160,
            fontSize: 8,
            width: 120,
            height: 200
          },
          // Ingredients
          {
            type: 'ingredients_list',
            field: 'ingredients',
            x: 20,
            y: 380,
            fontSize: 7,
            width: 250,
            wordWrap: true
          },
          // Allergen Warning
          {
            type: 'allergen_warning',
            field: 'allergens',
            x: 20,
            y: 420,
            fontSize: 8,
            fontWeight: 'bold',
            highlightAllergens: true
          }
        ]
      }
    };

    return this.create(foodTemplate);
  }
};