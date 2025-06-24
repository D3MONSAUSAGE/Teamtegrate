
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Building2, Loader2 } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
}

interface OrganizationSelectorProps {
  organizations: Organization[];
  isLoading: boolean;
  selectedOrganization?: string;
  onOrganizationChange: (organizationId: string) => void;
  label?: string;
  placeholder?: string;
}

const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  organizations = [], // Safe default
  isLoading,
  selectedOrganization,
  onOrganizationChange,
  label = "Select Organization",
  placeholder = "Choose an organization"
}) => {
  // Ensure organizations is always an array
  const safeOrganizations = Array.isArray(organizations) ? organizations : [];

  console.log('OrganizationSelector: Rendering with', {
    organizationsCount: safeOrganizations.length,
    isLoading,
    selectedOrganization
  });

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        {label}
      </Label>
      <Select 
        value={selectedOrganization || ""} 
        onValueChange={onOrganizationChange}
        disabled={isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? "Loading organizations..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </div>
          ) : safeOrganizations.length === 0 ? (
            <div className="text-center p-2 text-muted-foreground">
              No organizations found
            </div>
          ) : (
            safeOrganizations.map((org) => (
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

export default OrganizationSelector;
