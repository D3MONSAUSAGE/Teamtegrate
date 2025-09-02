import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedUserManagement } from '@/hooks/useEnhancedUserManagement';
import { usePermissionSchema } from './usePermissionSchema';

export type SystemRole = 'superadmin' | 'admin' | 'manager' | 'team_leader' | 'user';

interface RolePermissionRow {
  id: string;
  organization_id: string;
  role: string;
  module_id: string;
  action_id: string;
  granted: boolean;
}

interface JobRolePermissionRow {
  id: string;
  organization_id: string;
  job_role_id: string;
  module_id: string;
  action_id: string;
  granted: boolean;
}

interface UserOverrideRow {
  id: string;
  organization_id: string;
  user_id: string;
  module_id: string;
  action_id: string;
  granted: boolean;
}

export const ALL_ROLES: SystemRole[] = ['superadmin','admin','manager','team_leader','user'];

export const useAccessControlData = () => {
  const { user } = useAuth();
  const orgId = (user as any)?.organization_id as string | undefined ?? (user as any)?.organizationId as string | undefined;
  const currentUserId = user?.id as string | undefined;
  const isSuperadmin = user?.role === 'superadmin';

  const { users } = useEnhancedUserManagement();
  const { schema } = usePermissionSchema();

  const [rolePerms, setRolePerms] = useState<RolePermissionRow[]>([]);
  const [jobRolePerms, setJobRolePerms] = useState<JobRolePermissionRow[]>([]);
  const [userOverrides, setUserOverrides] = useState<UserOverrideRow[]>([]);
  const [jobRoles, setJobRoles] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [rp, jp, uo, jr] = await Promise.all([
          supabase.from('role_permissions').select('*').eq('organization_id', orgId),
          supabase.from('job_role_permissions').select('*').eq('organization_id', orgId),
          supabase.from('user_permission_overrides').select('*').eq('organization_id', orgId),
          supabase.from('job_roles').select('id, name, is_active').eq('organization_id', orgId)
        ]);
        if (rp.error) throw rp.error;
        if (jp.error) throw jp.error;
        if (uo.error) throw uo.error;
        if (jr.error) throw jr.error;
        if (!mounted) return;
        setRolePerms(rp.data || []);
        setJobRolePerms(jp.data || []);
        setUserOverrides(uo.data || []);
        setJobRoles((jr.data || []).filter(j => j.is_active).map(j => ({ id: j.id, name: j.name })));
      } catch (e: any) {
        if (!mounted) return;
        setError(e.message || 'Failed to load access control data');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [orgId]);

  const grantsForRole = useMemo(() => {
    const map = new Map<string, boolean>();
    rolePerms.forEach(r => map.set(`${r.module_id}:${r.action_id}:${r.role}`, r.granted));
    return map;
  }, [rolePerms]);

  const grantsForJobRole = useMemo(() => {
    const map = new Map<string, boolean>();
    jobRolePerms.forEach(r => map.set(`${r.module_id}:${r.action_id}:${r.job_role_id}`, r.granted));
    return map;
  }, [jobRolePerms]);

  const grantsForUser = useMemo(() => {
    const map = new Map<string, boolean>();
    userOverrides.forEach(r => map.set(`${r.module_id}:${r.action_id}:${r.user_id}`, r.granted));
    return map;
  }, [userOverrides]);

  const upsertRolePermission = async (role: SystemRole, module_id: string, action_id: string, granted: boolean) => {
    if (!orgId || !isSuperadmin) return;
    const { data, error } = await supabase.from('role_permissions').upsert({
      organization_id: orgId,
      role,
      module_id,
      action_id,
      granted
    }, { onConflict: 'organization_id,role,module_id,action_id' }).select();
    if (error) throw error;
    // audit log
    await supabase.from('permission_audit_log').insert({
      organization_id: orgId,
      changed_by: currentUserId,
      target_role: role,
      module_id,
      action_id,
      old_value: rolePerms.find(r => r.role === role && r.module_id === module_id && r.action_id === action_id)?.granted ?? null,
      new_value: granted,
      change_type: 'role'
    });
    setRolePerms(prev => {
      const copy = prev.filter(r => !(r.role === role && r.module_id === module_id && r.action_id === action_id));
      return [...copy, ...(data || [])];
    });
  };

  const upsertJobRolePermission = async (job_role_id: string, module_id: string, action_id: string, granted: boolean) => {
    if (!orgId || !isSuperadmin) return;
    const { data, error } = await supabase.from('job_role_permissions').upsert({
      organization_id: orgId,
      job_role_id,
      module_id,
      action_id,
      granted
    }, { onConflict: 'organization_id,job_role_id,module_id,action_id' }).select();
    if (error) throw error;
    await supabase.from('permission_audit_log').insert({
      organization_id: orgId,
      changed_by: currentUserId,
      target_job_role_id: job_role_id,
      module_id,
      action_id,
      old_value: jobRolePerms.find(r => r.job_role_id === job_role_id && r.module_id === module_id && r.action_id === action_id)?.granted ?? null,
      new_value: granted,
      change_type: 'job_role'
    });
    setJobRolePerms(prev => {
      const copy = prev.filter(r => !(r.job_role_id === job_role_id && r.module_id === module_id && r.action_id === action_id));
      return [...copy, ...(data || [])];
    });
  };

  const upsertUserOverride = async (target_user_id: string, module_id: string, action_id: string, granted: boolean) => {
    if (!orgId || !isSuperadmin || !currentUserId) return;
    const { data, error } = await supabase.from('user_permission_overrides').upsert({
      organization_id: orgId,
      user_id: target_user_id,
      module_id,
      action_id,
      granted,
      granted_by: currentUserId
    }, { onConflict: 'organization_id,user_id,module_id,action_id' }).select();
    if (error) throw error;
    await supabase.from('permission_audit_log').insert({
      organization_id: orgId,
      changed_by: currentUserId,
      target_user_id,
      module_id,
      action_id,
      old_value: userOverrides.find(r => r.user_id === target_user_id && r.module_id === module_id && r.action_id === action_id)?.granted ?? null,
      new_value: granted,
      change_type: 'user_override'
    });
    setUserOverrides(prev => {
      const copy = prev.filter(r => !(r.user_id === target_user_id && r.module_id === module_id && r.action_id === action_id));
      return [...copy, ...(data || [])];
    });
  };

  return {
    schema,
    roles: ALL_ROLES,
    users,
    jobRoles,
    loading,
    error,
    // current grants
    grantsForRole,
    grantsForJobRole,
    grantsForUser,
    // mutations
    upsertRolePermission,
    upsertJobRolePermission,
    upsertUserOverride,
    isSuperadmin
  };
};
