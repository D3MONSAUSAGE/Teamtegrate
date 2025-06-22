
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Building2, Loader2 } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
}

interface OrganizationSelectProps {
  organizations: Organization[];
  isLoading: boolean;
  selectedOrganization?: string;
  onOrganizationChange: (organizationId: string) => void;
}

const OrganizationSelect: React.FC<OrganizationSelectProps> = ({
  organizations,
  isLoading,
  selectedOrganization,
  onOrganizationChange,
}) => {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Select Organization
      </Label>
      <Select 
        value={selectedOrganization || ""} 
        onValueChange={onOrganizationChange}
        disabled={isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? "Loading organizations..." : "Choose an organization"} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center p-2 text-muted-foreground">
              No organizations found
            </div>
          ) : (
            organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default OrganizationSelect;
