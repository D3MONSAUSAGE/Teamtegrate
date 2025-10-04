import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EmployeeFilters {
  search?: string;
  teamId?: string;
  role?: string;
  department?: string;
  status?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  employee_id: string | null;
  hire_date: string | null;
  department: string | null;
  job_title: string | null;
  phone: string | null;
  avatar_url: string | null;
  location: string | null;
  manager_id: string | null;
  organization_id: string;
  manager?: {
    id: string;
    name: string;
  } | null;
  teams: Array<{
    team: {
      id: string;
      name: string;
    };
  }>;
}

export function useEmployees(filters?: EmployeeFilters) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return useQuery({
    queryKey: ['employees', user?.organizationId, filters],
    queryFn: async (): Promise<Employee[]> => {
      const selectQuery = `
        *,
        manager:users!manager_id(id, name),
        teams:team_memberships(
          team:teams!inner(id, name, manager_id)
        )
      `;
      
      // Build query with early type assertion to avoid deep type instantiation
      const baseQuery = (supabase.from('users') as any)
        .select(selectQuery)
        .eq('organization_id', user!.organizationId);

      // Apply filters dynamically
      let queryBuilder: any = baseQuery;

      // Manager restriction: only see employees in teams they manage
      if (!isAdmin) {
        queryBuilder = queryBuilder.filter('teams.team.manager_id', 'eq', user!.id);
      }

      // Apply filters
      if (filters?.teamId) {
        queryBuilder = queryBuilder.filter('teams.team.id', 'eq', filters.teamId);
      }

      if (filters?.role) {
        queryBuilder = queryBuilder.eq('role', filters.role);
      }

      if (filters?.search) {
        const searchTerm = `%${filters.search}%`;
        queryBuilder = queryBuilder.or(
          `name.ilike.${searchTerm},email.ilike.${searchTerm},employee_id.ilike.${searchTerm}`
        );
      }

      queryBuilder = queryBuilder.order('name');

      const { data, error } = await queryBuilder;
      if (error) throw error;

      // Transform and deduplicate if an employee is in multiple teams
      const uniqueEmployees = data?.reduce((acc, employee) => {
        if (!acc.find((e: Employee) => e.id === employee.id)) {
          acc.push({
            ...employee,
            manager: Array.isArray(employee.manager) && employee.manager.length > 0 
              ? employee.manager[0] 
              : null
          } as Employee);
        }
        return acc;
      }, [] as Employee[]);

      return uniqueEmployees;
    },
    enabled: !!user?.organizationId,
    staleTime: 30000,
  });
}
