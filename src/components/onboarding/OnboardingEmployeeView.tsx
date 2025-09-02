import { useAuth } from '@/contexts/auth/AuthProvider';
import { useMyOnboarding } from '@/hooks/onboarding/useOnboardingInstances';
import { OnboardingJourney } from './journey/OnboardingJourney';
import { MyOnboarding } from './MyOnboarding';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function OnboardingEmployeeView() {
  const { user } = useAuth();
  const { data: onboardingInstance, isLoading: instanceLoading } = useMyOnboarding();

  if (instanceLoading) {
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

  // Always prioritize the modern OnboardingJourney for template-based instances
  if (onboardingInstance.template_id) {
    return <OnboardingJourney instanceId={onboardingInstance.id} />;
  }

  // Only use legacy MyOnboarding for old custom instances without templates
  return <MyOnboarding />;
}
