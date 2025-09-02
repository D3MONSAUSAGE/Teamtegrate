import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import type { SalesChannel, CreateSalesChannelData, SalesChannelTransaction } from '@/types/salesChannels';

export const useSalesChannels = () => {
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchChannels = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('sales_channels')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching sales channels:', error);
        setError('Failed to load sales channels');
        toast.error('Failed to load sales channels');
        return;
      }

      setChannels(data as SalesChannel[] || []);
    } catch (error) {
      console.error('Error fetching sales channels:', error);
      setError('Failed to load sales channels');
      toast.error('Failed to load sales channels');
    } finally {
      setIsLoading(false);
    }
  };

  const createChannel = async (channelData: CreateSalesChannelData): Promise<boolean> => {
    try {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('sales_channels')
        .insert({
          ...channelData,
          created_by: user.id,
          organization_id: user.organizationId
        });

      if (error) {
        console.error('Error creating sales channel:', error);
        toast.error('Failed to create sales channel');
        return false;
      }

      toast.success('Sales channel created successfully');
      await fetchChannels();
      return true;
    } catch (error) {
      console.error('Error creating sales channel:', error);
      toast.error('Failed to create sales channel');
      return false;
    }
  };

  const updateChannel = async (id: string, updates: Partial<CreateSalesChannelData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sales_channels')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating sales channel:', error);
        toast.error('Failed to update sales channel');
        return false;
      }

      toast.success('Sales channel updated successfully');
      await fetchChannels();
      return true;
    } catch (error) {
      console.error('Error updating sales channel:', error);
      toast.error('Failed to update sales channel');
      return false;
    }
  };

  const toggleChannelStatus = async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sales_channels')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) {
        console.error('Error toggling channel status:', error);
        toast.error('Failed to update channel status');
        return false;
      }

      toast.success(`Channel ${isActive ? 'activated' : 'deactivated'} successfully`);
      await fetchChannels();
      return true;
    } catch (error) {
      console.error('Error toggling channel status:', error);
      toast.error('Failed to update channel status');
      return false;
    }
  };

  const deleteChannel = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sales_channels')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting sales channel:', error);
        toast.error('Failed to delete sales channel');
        return false;
      }

      toast.success('Sales channel deleted successfully');
      await fetchChannels();
      return true;
    } catch (error) {
      console.error('Error deleting sales channel:', error);
      toast.error('Failed to delete sales channel');
      return false;
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  return {
    channels,
    isLoading,
    error,
    createChannel,
    updateChannel,
    toggleChannelStatus,
    deleteChannel,
    refetchChannels: fetchChannels
  };
};