
import { Session } from '@supabase/supabase-js';
import { User, UserRole } from '@/types';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  profileLoading: boolean;
  isReady: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signup: (email: string, password: string, name: string, role: UserRole, organizationData?: { type: 'create' | 'join'; organizationName?: string; inviteCode?: string }) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  hasRoleAccess: (requiredRole: string) => boolean;
  canManageUser: (targetUser: User) => boolean;
  refreshUserSession: () => Promise<void>;
  syncProfileData: () => Promise<void>;
}
