import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserTeam {
  id: string;
  name: string;
}

export const useUserTeam = () => {
  const [team, setTeam] = useState<UserTeam | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserTeam = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Try to get user's team from team_memberships
        const { data: membership } = await supabase
          .from('team_memberships')
          .select('team_id, teams(id, name)')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (membership?.teams) {
          const teamData = Array.isArray(membership.teams) 
            ? membership.teams[0] 
            : membership.teams;
          
          setTeam({
            id: teamData.id,
            name: teamData.name
          });
        } else {
          // If no team membership, get first available team in organization
          const { data: userProfile } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', user.id)
            .single();

          if (userProfile?.organization_id) {
            const { data: firstTeam } = await supabase
              .from('teams')
              .select('id, name')
              .eq('organization_id', userProfile.organization_id)
              .eq('is_active', true)
              .limit(1)
              .single();

            if (firstTeam) {
              setTeam({
                id: firstTeam.id,
                name: firstTeam.name
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user team:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserTeam();
  }, []);

  return { team, isLoading };
};
