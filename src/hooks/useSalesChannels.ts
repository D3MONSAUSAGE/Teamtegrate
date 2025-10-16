import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import type { SalesChannel, CreateSalesChannelData } from '@/types/salesChannels';

const fetchChannels = async (): Promise<SalesChannel[]> => {
  const { data, error } = await supabase
    .from('sales_channels')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching sales channels:', error);
    throw new Error('Failed to load sales channels');
  }

  return data as SalesChannel[] || [];
};

export const useSalesChannels = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: channels = [], isLoading, error } = useQuery({
    queryKey: ['sales-channels'],
    queryFn: fetchChannels,
  });

  const createChannelMutation = useMutation({
    mutationFn: async (channelData: CreateSalesChannelData) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('sales_channels')
        .insert({
          ...channelData,
          created_by: user.id,
          organization_id: user.organizationId
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-channels'] });
      toast.success('Sales channel created successfully');
    },
    onError: (error) => {
      console.error('Error creating sales channel:', error);
      toast.error('Failed to create sales channel');
    },
  });

  const createChannel = async (channelData: CreateSalesChannelData): Promise<boolean> => {
    try {
      await createChannelMutation.mutateAsync(channelData);
      return true;
    } catch {
      return false;
    }
  };

  const updateChannelMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateSalesChannelData> }) => {
      const updateData = {
        ...updates,
        team_id: !updates.team_id || updates.team_id === 'all' ? null : updates.team_id,
      };

      const { error } = await supabase
        .from('sales_channels')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-channels'] });
      toast.success('Sales channel updated successfully');
    },
    onError: (error) => {
      console.error('Error updating sales channel:', error);
      toast.error('Failed to update sales channel');
    },
  });

  const updateChannel = async (id: string, updates: Partial<CreateSalesChannelData>): Promise<boolean> => {
    try {
      await updateChannelMutation.mutateAsync({ id, updates });
      return true;
    } catch {
      return false;
    }
  };

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('sales_channels')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      return isActive;
    },
    onSuccess: (isActive) => {
      queryClient.invalidateQueries({ queryKey: ['sales-channels'] });
      toast.success(`Channel ${isActive ? 'activated' : 'deactivated'} successfully`);
    },
    onError: (error) => {
      console.error('Error toggling channel status:', error);
      toast.error('Failed to update channel status');
    },
  });

  const toggleChannelStatus = async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      await toggleStatusMutation.mutateAsync({ id, isActive });
      return true;
    } catch {
      return false;
    }
  };

  const deleteChannelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sales_channels')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-channels'] });
      toast.success('Sales channel deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting sales channel:', error);
      toast.error('Failed to delete sales channel');
    },
  });

  const deleteChannel = async (id: string): Promise<boolean> => {
    try {
      await deleteChannelMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  const refetchChannels = () => {
    queryClient.invalidateQueries({ queryKey: ['sales-channels'] });
  };

  return {
    channels,
    isLoading,
    error: error ? String(error) : null,
    createChannel,
    updateChannel,
    toggleChannelStatus,
    deleteChannel,
    refetchChannels
  };
};