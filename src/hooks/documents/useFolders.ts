import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Folder {
  id: string;
  name: string;
  description?: string;
  color: string;
  team_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useFolders = (selectedTeamId?: string) => {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = async () => {
    if (!user?.organizationId) return;

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('folders')
        .select('*')
        .eq('organization_id', user.organizationId)
        .order('name');

      // Only filter by team if selectedTeamId is a valid UUID (not "all")
      if (selectedTeamId && selectedTeamId !== "all") {
        query = query.eq('team_id', selectedTeamId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setFolders(data || []);
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch folders');
    } finally {
      setIsLoading(false);
    }
  };

  const createFolder = async (name: string, description?: string, color?: string, teamId?: string) => {
    if (!user?.organizationId) throw new Error('No organization');

    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          name,
          description,
          color: color || '#6366f1',
          team_id: teamId,
          organization_id: user.organizationId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setFolders(prev => [...prev, data]);
      toast.success('Folder created successfully');
      return data;
    } catch (err) {
      console.error('Error creating folder:', err);
      toast.error('Failed to create folder');
      throw err;
    }
  };

  const updateFolder = async (id: string, updates: Partial<Pick<Folder, 'name' | 'description' | 'color'>>) => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setFolders(prev => prev.map(folder => folder.id === id ? data : folder));
      toast.success('Folder updated successfully');
      return data;
    } catch (err) {
      console.error('Error updating folder:', err);
      toast.error('Failed to update folder');
      throw err;
    }
  };

  const deleteFolder = async (id: string) => {
    try {
      // Check if folder has documents
      const { data: documents } = await supabase
        .from('documents')
        .select('id')
        .eq('folder_id', id)
        .limit(1);

      if (documents && documents.length > 0) {
        toast.error('Cannot delete folder with documents. Move documents first.');
        return;
      }

      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFolders(prev => prev.filter(folder => folder.id !== id));
      toast.success('Folder deleted successfully');
    } catch (err) {
      console.error('Error deleting folder:', err);
      toast.error('Failed to delete folder');
      throw err;
    }
  };

  const migrateLegacyFolders = async () => {
    if (!user?.organizationId) throw new Error('No organization');

    try {
      const { data, error } = await supabase.rpc('migrate_legacy_folders_to_database', {
        target_organization_id: user.organizationId
      });

      if (error) throw error;

      console.log('Migration results:', data);
      const results = data as { migrated_folders: number; updated_documents: number };
      toast.success(`Migration completed: ${results.migrated_folders} folders migrated, ${results.updated_documents} documents updated`);
      
      // Refresh folders after migration
      await fetchFolders();
      
      return results;
    } catch (err) {
      console.error('Error migrating legacy folders:', err);
      toast.error('Failed to migrate legacy folders');
      throw err;
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [user?.organizationId, selectedTeamId]);

  return {
    folders,
    isLoading,
    error,
    refetch: fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    migrateLegacyFolders,
  };
};