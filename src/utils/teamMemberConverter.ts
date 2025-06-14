
import { User } from '@/types';

export interface TeamMember {
  id: string;
  email: string;
  role: string;
  name: string;
  organization_id?: string; // Using organization_id as that's the likely property name
}

export const convertTeamMembersToUsers = (teamMembers: TeamMember[]): User[] => {
  return teamMembers.map(member => ({
    id: member.id,
    email: member.email,
    role: member.role as 'superadmin' | 'admin' | 'manager' | 'user',
    organizationId: member.organization_id || '', // Use organization_id from TeamMember
    name: member.name,
    createdAt: new Date(), // Default value since TeamMember doesn't have this
    timezone: 'UTC', // Default value
    avatar_url: undefined
  }));
};
