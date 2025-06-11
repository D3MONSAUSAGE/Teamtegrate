
import { User as SupabaseUser } from '@supabase/supabase-js';
import { AppUser, UserRole } from '@/types';

export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  updateUserProfile: (data: { name?: string }) => Promise<void>;
  hasRoleAccess: (requiredRole: UserRole) => boolean;
  canManageUser: (targetRole: UserRole) => boolean;
  refreshUserSession: () => Promise<void>;
}
