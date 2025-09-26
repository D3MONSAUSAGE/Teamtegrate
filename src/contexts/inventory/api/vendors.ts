import { supabase } from '@/integrations/supabase/client';
import { Vendor } from '../types';

export const vendorsApi = {
  async getAll(): Promise<Vendor[]> {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return (data || []) as Vendor[];
  },

  async create(vendor: Omit<Vendor, 'id' | 'created_at' | 'updated_at' | 'organization_id' | 'created_by'>): Promise<Vendor> {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) throw new Error('Not authenticated');

    // Get user's organization
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.user.id)
      .single();

    if (userDataError || !userData) throw new Error('Could not get user data');

    const vendorWithMetadata = {
      ...vendor,
      organization_id: userData.organization_id,
      created_by: user.user.id
    };

    const { data, error } = await supabase
      .from('vendors')
      .insert([vendorWithMetadata])
      .select()
      .single();

    if (error) {
      console.error('❌ Database error during vendor creation:', error);
      throw error;
    }
    
    console.log('✅ Vendor created successfully:', data);
    return data as Vendor;
  },

  async update(id: string, updates: Partial<Omit<Vendor, 'id' | 'created_at' | 'updated_at' | 'organization_id' | 'created_by'>>): Promise<Vendor> {
    const { data, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Database error during vendor update:', error);
      throw error;
    }
    return data as Vendor;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('vendors')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  async getById(id: string): Promise<Vendor | null> {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as Vendor;
  }
};