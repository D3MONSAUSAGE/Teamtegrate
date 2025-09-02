import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedUserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  organization_id: string;
  created_at: string;
  phone?: string;
  address?: string;
  employee_id?: string;
  hire_date?: string;
  preferred_name?: string;
  department?: string;
  job_title?: string;
  manager_id?: string;
  avatar_url?: string;
  emergency_contact_needed: boolean;
}

export interface UserTeamInfo {
  id: string;
  name: string;
  role: string;
  manager_name?: string;
  joined_at?: string;
}

export interface TrainingRecord {
  id: string;
  content_title: string;
  assignment_type: string;
  status: string;
  completed_at?: string;
  completion_score?: number;
  due_date?: string;
}

export interface ComprehensiveProfile {
  user: EnhancedUserProfile;
  manager?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  teams: UserTeamInfo[];
  trainings: TrainingRecord[];
  directReports: EnhancedUserProfile[];
}

export const useEnhancedProfile = (userId?: string) => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ComprehensiveProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetUserId = userId || currentUser?.id;
  const isOwnProfile = !userId || userId === currentUser?.id;

  const fetchComprehensiveProfile = async () => {
    if (!targetUserId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch user profile with extended fields
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (userError) throw userError;

      // Fetch manager info if manager_id exists
      let managerData = null;
      if (userData.manager_id) {
        const { data: manager } = await supabase
          .from('users')
          .select('id, name, email, avatar_url')
          .eq('id', userData.manager_id)
          .single();
        managerData = manager;
      }

      // Fetch team memberships
      const { data: teamsData } = await supabase
        .from('team_memberships')
        .select(`
          role,
          team_id,
          joined_at,
          teams:team_id (
            id,
            name,
            manager_id,
            users:manager_id (
              name
            )
          )
        `)
        .eq('user_id', targetUserId);

      const teams = teamsData?.map(tm => ({
        id: tm.teams?.id || '',
        name: tm.teams?.name || '',
        role: tm.role,
        manager_name: tm.teams?.users?.name,
        joined_at: tm.joined_at,
      })) || [];

      // Fetch training assignments
      const { data: trainingsData } = await supabase
        .from('training_assignments')
        .select('*')
        .eq('assigned_to', targetUserId)
        .order('assigned_at', { ascending: false });

      const trainings = trainingsData?.map(ta => ({
        id: ta.id,
        content_title: ta.content_title,
        assignment_type: ta.assignment_type,
        status: ta.status,
        completed_at: ta.completed_at,
        completion_score: ta.completion_score,
        due_date: ta.due_date,
      })) || [];

      // Fetch direct reports if user is a manager
      const { data: directReportsData } = await supabase
        .from('users')
        .select('*')
        .eq('manager_id', targetUserId);

      const directReports = directReportsData || [];

      setProfile({
        user: userData,
        manager: managerData,
        teams,
        trainings,
        directReports,
      });

    } catch (error) {
      console.error('Error fetching comprehensive profile:', error);
      setError('Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<EnhancedUserProfile>) => {
    if (!targetUserId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', targetUserId)
        .select()
        .single();

      if (error) throw error;

      setProfile(prev => prev ? {
        ...prev,
        user: { ...prev.user, ...data }
      } : null);

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComprehensiveProfile();
  }, [targetUserId]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchComprehensiveProfile,
    isOwnProfile,
  };
};