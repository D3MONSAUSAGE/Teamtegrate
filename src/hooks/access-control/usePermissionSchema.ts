import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PermissionModule {
  id: string;
  name: string;
  display_name: string;
  description?: string | null;
}

export interface PermissionAction {
  id: string;
  module_id: string;
  name: string;
  display_name: string;
  description?: string | null;
}

export interface ModuleWithActions {
  module: PermissionModule;
  actions: PermissionAction[];
}

export const usePermissionSchema = () => {
  const [modules, setModules] = useState<PermissionModule[]>([]);
  const [actions, setActions] = useState<PermissionAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [{ data: mods, error: modErr }, { data: acts, error: actErr }] = await Promise.all([
          supabase.from('permission_modules').select('*').eq('is_active', true),
          supabase.from('permission_actions').select('*')
        ]);
        if (modErr) throw modErr;
        if (actErr) throw actErr;
        if (!isMounted) return;
        setModules(mods || []);
        setActions(acts || []);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e.message || 'Failed to load permission schema');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const schema: ModuleWithActions[] = modules.map(m => ({
    module: m,
    actions: actions.filter(a => a.module_id === m.id)
  }));

  return { schema, modules, actions, loading, error };
};
