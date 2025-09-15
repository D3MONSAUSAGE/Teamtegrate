import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

interface ChecklistHistoryFilters {
  dateRange?: DateRange;
  teamId?: string;
  searchTerm?: string;
  status?: string;
}

export const useAdvancedChecklistHistory = (filters: ChecklistHistoryFilters = {}, limit = 50) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['advanced-checklist-history', filters, limit],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('checklist_executions')
        .select(`
          *,
          checklist:checklists(*),
          assigned_user:users!assigned_to_user_id(
            id, 
            name, 
            email,
            team_memberships(
              team_id,
              teams(id, name)
            )
          ),
          verifier:users!verified_by(id, name, email),
          checklist_execution_items(
            id,
            is_completed,
            is_verified,
            completed_at,
            verified_at,
            checklist_item:checklist_items(title),
            verifier:users!checklist_execution_items_verified_by_fk(id, name)
          )
        `);

      // Date range filtering
      if (filters.dateRange?.from) {
        const fromDate = format(filters.dateRange.from, 'yyyy-MM-dd');
        query = query.gte('execution_date', fromDate);
      }
      if (filters.dateRange?.to) {
        const toDate = format(filters.dateRange.to, 'yyyy-MM-dd');
        query = query.lte('execution_date', toDate);
      }

      // Team filtering - get team member IDs first if team filter is applied
      let teamMemberIds: string[] = [];
      if (filters.teamId) {
        const { data: teamMembers } = await supabase
          .from('team_memberships')
          .select('user_id')
          .eq('team_id', filters.teamId);
        
        teamMemberIds = teamMembers?.map(tm => tm.user_id) || [];
        if (teamMemberIds.length > 0) {
          query = query.in('assigned_to_user_id', teamMemberIds);
        } else {
          // No team members found, return empty result
          return [];
        }
      }

      // Status filtering - exclude pending by default, only show actual work done
      if (filters.status === 'completed_verified') {
        query = query.in('status', ['completed', 'verified']);
      } else if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status as any);
      } else {
        // Default: only show executions that have been started (exclude pending assignments)
        query = query.not('status', 'eq', 'pending');
      }

      // Execute query
      const { data, error } = await query
        .order('execution_date', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Client-side search filtering for name/checklist
      let filteredData = data || [];
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredData = filteredData.filter(execution => 
          execution.checklist?.name?.toLowerCase().includes(searchLower) ||
          execution.assigned_user?.name?.toLowerCase().includes(searchLower) ||
          execution.verifier?.name?.toLowerCase().includes(searchLower)
        );
      }

      return filteredData;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};