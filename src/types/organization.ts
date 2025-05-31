
export interface Organization {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export type UserRole = 'admin' | 'manager' | 'team_member';

export interface UserMetadata {
  organization_id: string;
  role: UserRole;
  name: string;
}
