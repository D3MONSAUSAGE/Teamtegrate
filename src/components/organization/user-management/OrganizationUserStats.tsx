
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';
import OrganizationSelector from '../OrganizationSelector';

interface OrganizationUserStatsProps {
  currentUserRole: string | undefined;
  organizations: any[];
  loadingOrgs: boolean;
  selectedOrganizationId: string;
  onOrganizationChange: (orgId: string) => void;
}

const OrganizationUserStats: React.FC<OrganizationUserStatsProps> = ({
  currentUserRole,
  organizations,
  loadingOrgs,
  selectedOrganizationId,
  onOrganizationChange
}) => {
  return (
    <div className="space-y-4">
      {/* Organization Selector for Superadmin */}
      {currentUserRole === 'superadmin' && (
        <OrganizationSelector
          organizations={organizations}
          isLoading={loadingOrgs}
          selectedOrganization={selectedOrganizationId}
          onOrganizationChange={onOrganizationChange}
          label="View Organization Users"
          placeholder="Select organization to manage"
        />
      )}

      {/* Current Organization Info */}
      {selectedOrganizationId && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Viewing users from: {organizations.find(o => o.id === selectedOrganizationId)?.name || 'Selected Organization'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default OrganizationUserStats;
