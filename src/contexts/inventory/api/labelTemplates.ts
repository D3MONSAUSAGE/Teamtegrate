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
  type: 'text' | 'barcode' | 'qr' | 'image' | 'line' | 'rectangle';
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
  }
};