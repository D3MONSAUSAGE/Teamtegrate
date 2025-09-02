import { useAuth } from '@/contexts/auth/AuthProvider';
import { useMyOnboarding } from '@/hooks/onboarding/useOnboardingInstances';
import { useOnboardingJourney } from '@/hooks/onboarding/useOnboardingJourney';
import { OnboardingJourney } from './journey/OnboardingJourney';
import { MyOnboarding } from './MyOnboarding';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function OnboardingEmployeeView() {
  const { user } = useAuth();
  const { data: onboardingInstance, isLoading: instanceLoading } = useMyOnboarding();
  
  // Check if this instance has rich journey structure (steps)
  const { data: hasSteps, isLoading: stepsLoading } = useQuery({
    queryKey: ['instance-has-steps', onboardingInstance?.id],
    queryFn: async () => {
      if (!onboardingInstance?.id) return false;
      
      const { data, error } = await supabase
        .from('onboarding_instance_step_progress')
        .select('id')
        .eq('instance_id', onboardingInstance.id)
        .limit(1);
      
      if (error) throw error;
      return data && data.length > 0;
    },
    enabled: !!onboardingInstance?.id,
  });

  const isLoading = instanceLoading || stepsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 mx-auto text-muted-foreground mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading your onboarding...</p>
        </CardContent>
      </Card>
    );
  }

  if (!onboardingInstance) {
    return <MyOnboarding />;
  }

  // If instance has rich journey structure, show OnboardingJourney
  if (hasSteps) {
    return <OnboardingJourney instanceId={onboardingInstance.id} />;
  }

  // Otherwise, show legacy MyOnboarding
  return <MyOnboarding />;
}
