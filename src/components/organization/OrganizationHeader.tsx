
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, Calendar } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/contexts/AuthContext';

const OrganizationHeader: React.FC = () => {
  const { data: organization, isLoading, error } = useOrganization();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-48"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-destructive">
            <Building2 className="h-5 w-5" />
            <span>Error loading organization: {error.message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!organization) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-orange-600">
            <Building2 className="h-5 w-5" />
            <span>No organization found for user</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground">{organization.name}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Your Role: {user?.role}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Member since: {memberSince}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationHeader;
