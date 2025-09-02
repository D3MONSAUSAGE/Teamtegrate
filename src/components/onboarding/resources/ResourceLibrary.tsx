import React from 'react';
import { useOnboardingResources } from '@/hooks/onboarding/useOnboardingResources';
import { ResourceFilterOptions } from '@/types/resources';
import { ResourceCard } from './ResourceCard';
import { Loader2 } from 'lucide-react';

interface ResourceLibraryProps {
  filters?: ResourceFilterOptions;
}

export const ResourceLibrary: React.FC<ResourceLibraryProps> = ({ filters }) => {
  const { resources, isLoading, error } = useOnboardingResources(filters);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading resources...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive">Failed to load resources</p>
        <p className="text-sm text-muted-foreground mt-1">
          {error.message}
        </p>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No resources found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters or create a new resource
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resources.map((resource) => (
        <ResourceCard key={resource.id} resource={resource} />
      ))}
    </div>
  );
};