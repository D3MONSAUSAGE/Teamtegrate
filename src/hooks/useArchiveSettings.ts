import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import type { ArchiveSettings, ArchiveThresholdOption } from '@/types/archive';

export const useArchiveSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['archive-settings', user?.id],
    queryFn: async (): Promise<ArchiveSettings | null> => {
      if (!user?.id) return null;

      // First try to get user-specific settings
      let { data, error } = await supabase
        .from('archive_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user archive settings:', error);
        throw error;
      }

      // If no user settings, try organization settings
      if (!data && user.organizationId) {
        const { data: orgData, error: orgError } = await supabase
          .from('archive_settings')
          .select('*')
          .eq('organization_id', user.organizationId)
          .is('user_id', null)
          .maybeSingle();

        if (orgError && orgError.code !== 'PGRST116') {
          console.error('Error fetching organization archive settings:', orgError);
          throw orgError;
        }

        data = orgData;
      }

      if (!data) {
        // Return default settings
        return {
          id: '',
          userId: user.id,
          thresholdDays: 90,
          autoArchiveEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      return {
        id: data.id,
        organizationId: data.organization_id,
        userId: data.user_id,
        thresholdDays: data.threshold_days,
        autoArchiveEnabled: data.auto_archive_enabled,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    },
    enabled: !!user?.id,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: { thresholdDays: ArchiveThresholdOption; autoArchiveEnabled: boolean }) => {
      if (!user?.id) throw new Error('No user found');

      const { data, error } = await supabase
        .from('archive_settings')
        .upsert({
          user_id: user.id,
          threshold_days: newSettings.thresholdDays,
          auto_archive_enabled: newSettings.autoArchiveEnabled,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating archive settings:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archive-settings'] });
      toast.success('Archive settings updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update archive settings:', error);
      toast.error('Failed to update archive settings');
    },
  });

  return {
    settings,
    isLoading,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
  };
};