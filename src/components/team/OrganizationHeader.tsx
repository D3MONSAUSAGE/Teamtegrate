
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Loader2 } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';

const OrganizationHeader: React.FC = () => {
  const { data: organization, isLoading, error } = useOrganization();

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading organization...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !organization) {
    return (
      <Card className="mb-6 border-destructive/20 bg-destructive/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-destructive" />
            <span className="text-sm text-destructive">
              Unable to load organization information
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Current Organization
            </p>
            <p className="text-lg font-semibold text-primary">
              {organization.name}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationHeader;
