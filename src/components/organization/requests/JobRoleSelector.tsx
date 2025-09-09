import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useJobRoles } from '@/hooks/useJobRoles';
import { Users, Target, MapPin, BarChart3 } from 'lucide-react';

interface JobRoleSelectorProps {
  selectedRoles: string[];
  onSelectionChange: (roleIds: string[]) => void;
  expertiseTags?: string[];
  onExpertiseChange?: (tags: string[]) => void;
  geographicScope?: string;
  onGeographicScopeChange?: (scope: string) => void;
  workloadBalancing?: boolean;
  onWorkloadBalancingChange?: (enabled: boolean) => void;
  showAdvanced?: boolean;
}

const JobRoleSelector: React.FC<JobRoleSelectorProps> = ({
  selectedRoles,
  onSelectionChange,
  expertiseTags = [],
  onExpertiseChange,
  geographicScope = 'any',
  onGeographicScopeChange,
  workloadBalancing = true,
  onWorkloadBalancingChange,
  showAdvanced = true
}) => {
  const { jobRoles, isLoading } = useJobRoles();

  const handleRoleToggle = (roleId: string) => {
    console.log('Toggling job role:', roleId, 'Current selection:', selectedRoles);
    if (selectedRoles.includes(roleId)) {
      onSelectionChange(selectedRoles.filter(id => id !== roleId));
    } else {
      onSelectionChange([...selectedRoles, roleId]);
    }
  };

  const handleExpertiseTagAdd = (tag: string) => {
    if (onExpertiseChange && !expertiseTags.includes(tag)) {
      onExpertiseChange([...expertiseTags, tag]);
    }
  };

  const handleExpertiseTagRemove = (tag: string) => {
    if (onExpertiseChange) {
      onExpertiseChange(expertiseTags.filter(t => t !== tag));
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-24 bg-muted rounded"></div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Default Job Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Select which job roles should typically handle this request type.
            </p>
            <div className="flex flex-wrap gap-2">
              {jobRoles.map(role => (
                <Badge
                  key={role.id}
                  variant={selectedRoles.includes(role.id) ? "default" : "outline"}
                  className="cursor-pointer transition-colors hover:scale-105"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Job role badge clicked:', role.id);
                    handleRoleToggle(role.id);
                  }}
                >
                  {role.name}
                </Badge>
              ))}
            </div>
            {selectedRoles.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No job roles selected. Requests will use standard role-based assignment.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {showAdvanced && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4" />
                Expertise Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Specify expertise tags to match specialized skills.
                </p>
                <div className="flex flex-wrap gap-2">
                  {expertiseTags.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleExpertiseTagRemove(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add expertise tag..."
                    className="flex-1 px-3 py-1 text-sm border rounded"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        handleExpertiseTagAdd(e.currentTarget.value.trim());
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input?.value.trim()) {
                        handleExpertiseTagAdd(input.value.trim());
                        input.value = '';
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                Geographic Scope
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Prefer local assignees when possible.
                </p>
                <select
                  value={geographicScope}
                  onChange={(e) => onGeographicScopeChange?.(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="any">Any Location</option>
                  <option value="local_preferred">Local Preferred</option>
                  <option value="local_only">Local Only</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                Assignment Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Workload Balancing</Label>
                    <p className="text-xs text-muted-foreground">
                      Distribute requests evenly among eligible approvers
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={workloadBalancing}
                    onChange={(e) => onWorkloadBalancingChange?.(e.target.checked)}
                    className="rounded"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default JobRoleSelector;