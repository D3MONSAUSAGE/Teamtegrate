
export interface Team {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  manager_name?: string;
  manager_email?: string;
  member_count: number;
  require_schedule_for_clock_in?: boolean | null;
  user_team_role?: 'manager' | 'member';
}

export interface TeamMembership {
  id: string;
  team_id: string;
  user_id: string;
  role: 'manager' | 'member';
  joined_at: string;
}

export interface TeamStats {
  total_teams: number;
  teams_with_managers: number;
  total_team_members: number;
  average_team_size: number;
}

export interface CreateTeamData {
  name: string;
  description?: string;
  manager_id?: string;
  require_schedule_for_clock_in?: boolean | null;
}
