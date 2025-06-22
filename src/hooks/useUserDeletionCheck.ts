
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

interface DeletionImpact {
  tasks_assigned: number;
  projects_managed: number;
  chat_rooms_created: number;
  organizations_created: number;
  team_memberships: number;
  is_sole_admin: boolean;
}

interface UseDeletionCheckResult {
  impact: DeletionImpact | null;
  isLoading: boolean;
  error: string | null;
  canDelete: boolean;
  warnings: string[];
}

export const useUserDeletionCheck = (user: User | null): UseDeletionCheckResult => {
  const [impact, setImpact] = useState<DeletionImpact | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setImpact(null);
      return;
    }

    const checkDeletionImpact = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: rpcError } = await supabase
          .rpc('get_user_deletion_impact', { target_user_id: user.id });

        if (rpcError) {
          console.error('Error checking deletion impact:', rpcError);
          setError('Failed to analyze deletion impact');
          return;
        }

        // Safely parse the JSON response to our DeletionImpact interface
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          const typedImpact: DeletionImpact = {
            tasks_assigned: Number(data.tasks_assigned) || 0,
            projects_managed: Number(data.projects_managed) || 0,
            chat_rooms_created: Number(data.chat_rooms_created) || 0,
            organizations_created: Number(data.organizations_created) || 0,
            team_memberships: Number(data.team_memberships) || 0,
            is_sole_admin: Boolean(data.is_sole_admin)
          };
          setImpact(typedImpact);
        } else {
          setError('Invalid response format from deletion impact check');
        }
      } catch (err) {
        console.error('Error in deletion check:', err);
        setError('Failed to check deletion requirements');
      } finally {
        setIsLoading(false);
      }
    };

    checkDeletionImpact();
  }, [user]);

  const canDelete = impact ? !impact.is_sole_admin : false;

  const warnings = [];
  if (impact) {
    if (impact.is_sole_admin) {
      warnings.push('This user is the only admin in one or more organizations. Please assign another admin first.');
    }
    if (impact.tasks_assigned > 0) {
      warnings.push(`This user is assigned to ${impact.tasks_assigned} task(s) which will be unassigned.`);
    }
    if (impact.projects_managed > 0) {
      warnings.push(`This user manages ${impact.projects_managed} project(s). Consider reassigning ownership.`);
    }
    if (impact.chat_rooms_created > 0) {
      warnings.push(`This user created ${impact.chat_rooms_created} chat room(s).`);
    }
    if (impact.organizations_created > 0) {
      warnings.push(`This user created ${impact.organizations_created} organization(s).`);
    }
  }

  return {
    impact,
    isLoading,
    error,
    canDelete,
    warnings
  };
};
