import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';
import { logger } from '@/utils/logger';

interface DocumentItem {
  id: string;
  title: string;
  file_path: string;
  storage_id?: string;
  file_type: string;
  created_at: string;
  size_bytes: number;
  folder?: string; // Legacy folder name
  folder_id?: string; // New folder ID reference
  is_pinned: boolean;
  team_id?: string;
  user_id: string;
}

export const useTeamDocuments = (selectedTeamId?: string) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = hasRoleAccess(user?.role, 'admin');

  const fetchDocuments = async () => {
    if (!user?.organizationId) return;

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('documents')
        .select('*')
        .eq('organization_id', user.organizationId)
        .order('created_at', { ascending: false });

      // If a specific team is selected, filter by that team
      if (selectedTeamId) {
        query = query.eq('team_id', selectedTeamId);
      } else if (!isAdmin) {
        // For non-admins, show documents from their teams + unassigned documents
        const { data: userTeams } = await supabase
          .from('team_memberships')
          .select('team_id')
          .eq('user_id', user.id);

        const teamIds = userTeams?.map(t => t.team_id) || [];
        
        if (teamIds.length > 0) {
          query = query.or(`team_id.in.(${teamIds.join(',')}),team_id.is.null`);
        } else {
          query = query.is('team_id', null);
        }
      }
      // For admins without team selection, show all documents

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setDocuments(data || []);

      // Extract unique folders - only check if data exists
      const uniqueFolders = data && data.length > 0 
        ? [...new Set(
            data
              .filter(doc => doc.folder && doc.folder.trim() !== '')
              .map(doc => doc.folder!)
          )]
        : [];
      setFolders(uniqueFolders);

    } catch (err) {
      logger.error('Error fetching team documents', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  };

  const createFolder = async (folderName: string, teamId?: string) => {
    if (!folders.includes(folderName)) {
      setFolders(prev => [...prev, folderName]);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user?.organizationId, selectedTeamId]);

  return {
    documents,
    folders,
    isLoading,
    error,
    refetch: fetchDocuments,
    createFolder,
  };
};