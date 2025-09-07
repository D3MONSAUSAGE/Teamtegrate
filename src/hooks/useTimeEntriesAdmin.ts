import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTeamQueries } from './organization/team/useTeamQueries';
import { useRealTeamMembers } from './team/useRealTeamMembers';

export interface TimeEntryRow {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
  notes: string | null;
}

interface OrgUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export const useTimeEntriesAdmin = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [entries, setEntries] = useState<TimeEntryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserTeamId, setCurrentUserTeamId] = useState<string | null>(null);

  const canManageOthers = useMemo(() => ['manager', 'admin', 'superadmin'].includes(role || ''), [role]);
  const isManager = useMemo(() => role === 'manager', [role]);
  const isAdminOrSuperAdmin = useMemo(() => ['admin', 'superadmin'].includes(role || ''), [role]);

  // Get teams data
  const { teams, isLoading: teamsLoading } = useTeamQueries();
  
  // Get team members for the selected team (or current user's team for managers)
  const teamIdForMembers = isManager ? currentUserTeamId : selectedTeamId;
  const { teamMembers, isLoading: teamMembersLoading } = useRealTeamMembers(teamIdForMembers || undefined);

  useEffect(() => {
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id || null;
      setCurrentUserId(uid);
      setTargetUserId(uid);

      if (uid) {
        // Get role and user details including team info
        const { data: roleData } = await supabase.rpc('get_current_user_role');
        if (roleData) setRole(roleData as string);

        // Get current user's org and team info
        const { data: me } = await supabase
          .from('users')
          .select('organization_id, team_id')
          .eq('id', uid)
          .maybeSingle();
        const orgId = (me as any)?.organization_id || null;
        const userTeamId = (me as any)?.team_id || null;
        setCurrentOrgId(orgId);
        setCurrentUserTeamId(userTeamId);

        // For managers, set their team as selected by default
        if (roleData === 'manager' && userTeamId) {
          setSelectedTeamId(userTeamId);
        }
      }
    })();
  }, []);

  const refresh = useCallback(async (userId: string, start: Date, end: Date) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('id, user_id, clock_in, clock_out, duration_minutes, notes')
        .eq('user_id', userId)
        .gte('clock_in', start.toISOString())
        .lt('clock_in', end.toISOString())
        .order('clock_in', { ascending: true });
      if (error) throw error;
      setEntries((data || []) as TimeEntryRow[]);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load time entries');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createEntry = useCallback(async (payload: { user_id: string; clock_in: string; clock_out: string | null; notes?: string }) => {
    try {
      const values = [{
        user_id: payload.user_id,
        clock_in: payload.clock_in,
        clock_out: payload.clock_out,
        notes: payload.notes || null,
        // Provide organization_id to satisfy generated types; trigger will ensure correctness as well
        ...(currentOrgId ? { organization_id: currentOrgId } : {}),
      }];
      const { error } = await supabase.from('time_entries').insert(values as any);
      if (error) throw error;
      toast.success('Time entry added');
    } catch (e: any) {
      toast.error(e.message || 'Failed to add time entry');
    }
  }, [currentOrgId]);

  const updateEntry = useCallback(async (id: string, updates: { clock_in?: string; clock_out?: string | null; notes?: string }) => {
    try {
      const { error } = await supabase
        .from('time_entries')
        .update({
          ...(updates.clock_in ? { clock_in: updates.clock_in } : {}),
          ...(updates.clock_out !== undefined ? { clock_out: updates.clock_out } : {}),
          ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
        })
        .eq('id', id);
      if (error) throw error;
      toast.success('Time entry updated');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update time entry');
    }
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('time_entries').delete().eq('id', id);
      if (error) throw error;
      toast.success('Time entry deleted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete time entry');
    }
  }, []);

  // Filter users based on role and team selection
  const filteredUsers = useMemo(() => {
    if (isManager && currentUserTeamId) {
      // Managers can only see their team members
      return teamMembers.map(tm => ({
        id: tm.id,
        name: tm.name,
        email: tm.email,
        role: tm.role,
      }));
    } else if (isAdminOrSuperAdmin) {
      if (selectedTeamId) {
        // Admins with team selected: show team members
        return teamMembers.map(tm => ({
          id: tm.id,
          name: tm.name,
          email: tm.email,
          role: tm.role,
        }));
      } else {
        // Admins with no team selected: show all organization users
        return users;
      }
    }
    return users;
  }, [isManager, isAdminOrSuperAdmin, currentUserTeamId, selectedTeamId, teamMembers, users]);

  // Load all organization users for admins (when no team filter)
  useEffect(() => {
    if (currentOrgId && isAdminOrSuperAdmin && !selectedTeamId) {
      (async () => {
        const { data: orgUsers, error } = await supabase
          .from('users')
          .select('id, name, email, role')
          .eq('organization_id', currentOrgId)
          .order('name', { ascending: true });
        if (!error && orgUsers) setUsers(orgUsers as OrgUser[]);
      })();
    }
  }, [currentOrgId, isAdminOrSuperAdmin, selectedTeamId]);

  return {
    currentUserId,
    currentOrgId,
    role,
    canManageOthers,
    isManager,
    isAdminOrSuperAdmin,
    users: filteredUsers,
    targetUserId,
    setTargetUserId,
    selectedTeamId,
    setSelectedTeamId,
    teams,
    entries,
    isLoading: isLoading || teamsLoading || teamMembersLoading,
    refresh,
    createEntry,
    updateEntry,
    deleteEntry,
  };
};
