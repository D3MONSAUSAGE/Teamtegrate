import { supabase } from '@/integrations/supabase/client';

export interface GeneratedLabel {
  id: string;
  organization_id: string;
  template_id: string;
  item_id?: string;
  lot_id?: string;
  label_data: any;
  print_format: string;
  quantity_printed: number;
  printed_by: string;
  printed_at: string;
  // Joined data
  label_template?: {
    name: string;
    category: string;
  };
  inventory_item?: {
    name: string;
    sku: string;
  };
  inventory_lot?: {
    lot_number: string;
  };
}

export const generatedLabelsApi = {
  async getAll(limit: number = 100): Promise<GeneratedLabel[]> {
    const { data, error } = await supabase
      .from('generated_labels')
      .select(`
        *,
        label_templates(name, category),
        inventory_items(name, sku),
        inventory_lots(lot_number)
      `)
      .order('printed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as GeneratedLabel[];
  },

  async getByItemId(itemId: string): Promise<GeneratedLabel[]> {
    const { data, error } = await supabase
      .from('generated_labels')
      .select(`
        *,
        label_templates(name, category),
        inventory_items(name, sku),
        inventory_lots(lot_number)
      `)
      .eq('item_id', itemId)
      .order('printed_at', { ascending: false });

    if (error) throw error;
    return (data || []) as GeneratedLabel[];
  },

  async create(label: Omit<GeneratedLabel, 'id' | 'printed_at'>): Promise<GeneratedLabel> {
    const { data, error } = await supabase
      .from('generated_labels')
      .insert([label])
      .select()
      .single();

    if (error) throw error;
    return data as GeneratedLabel;
  },

  async getStats(days: number = 30): Promise<{
    total_labels: number;
    unique_templates: number;
    most_used_template: string;
    daily_average: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('generated_labels')
      .select(`
        quantity_printed,
        template_id,
        label_templates(name)
      `)
      .gte('printed_at', startDate.toISOString());

    if (error) throw error;

    const labels = data || [];
    const totalLabels = labels.reduce((sum, label) => sum + label.quantity_printed, 0);
    const templateCounts = labels.reduce((acc, label) => {
      const templateId = label.template_id;
      acc[templateId] = (acc[templateId] || 0) + label.quantity_printed;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedTemplateId = Object.keys(templateCounts).reduce((a, b) => 
      templateCounts[a] > templateCounts[b] ? a : b, ''
    );

    return {
      total_labels: totalLabels,
      unique_templates: Object.keys(templateCounts).length,
      most_used_template: mostUsedTemplateId || 'None',
      daily_average: Math.round(totalLabels / days * 10) / 10
    };
  }
};