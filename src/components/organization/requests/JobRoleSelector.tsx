import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useJobRoles } from '@/hooks/useJobRoles';
import { Briefcase, Plus, X } from 'lucide-react';

interface JobRoleSelectorProps {
  selectedRoles: string[];
  onSelectionChange: (roles: string[]) => void;
  expertiseTags?: string[];
  onExpertiseChange?: (tags: string[]) => void;
  showAdvanced?: boolean;
}

const JobRoleSelector: React.FC<JobRoleSelectorProps> = ({
  selectedRoles,
  onSelectionChange,
  expertiseTags = [],
  onExpertiseChange,
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

  const [newExpertiseTag, setNewExpertiseTag] = useState('');

  const handleExpertiseTagAdd = () => {
    if (newExpertiseTag.trim() && !expertiseTags.includes(newExpertiseTag.trim())) {
      onExpertiseChange?.([...expertiseTags, newExpertiseTag.trim()]);
      setNewExpertiseTag('');
    }
  };

  const handleExpertiseTagRemove = (tagToRemove: string) => {
    onExpertiseChange?.(expertiseTags.filter(tag => tag !== tagToRemove));
  };

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-muted rounded"></div>;
  }

  return (
    <div className="space-y-6">
      {/* Job Roles Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          <Label className="text-base font-medium">Default Job Roles</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Select which job roles should be considered for assignment by default.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {jobRoles.map(role => (
            <div key={role.id} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-muted/50">
              <Checkbox
                id={`role-${role.id}`}
                checked={selectedRoles.includes(role.id)}
                onCheckedChange={() => handleRoleToggle(role.id)}
              />
              <Label htmlFor={`role-${role.id}`} className="flex-1 cursor-pointer text-sm">
                {role.name}
              </Label>
            </div>
          ))}
        </div>

        {selectedRoles.length > 0 && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium">Selected Roles ({selectedRoles.length})</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedRoles.map(roleId => {
                const role = jobRoles.find(r => r.id === roleId);
                return role ? (
                  <Badge key={roleId} variant="secondary" className="text-xs">
                    {role.name}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>

      {showAdvanced && (
        <>
          {/* Expertise Tags */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Expertise Tags</Label>
            <p className="text-sm text-muted-foreground">
              Add specific expertise requirements for this request type.
            </p>
            
            <div className="flex gap-2">
              <Input
                value={newExpertiseTag}
                onChange={(e) => setNewExpertiseTag(e.target.value)}
                placeholder="Add expertise tag..."
                onKeyPress={(e) => e.key === 'Enter' && handleExpertiseTagAdd()}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={handleExpertiseTagAdd}
                disabled={!newExpertiseTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {expertiseTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {expertiseTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => handleExpertiseTagRemove(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default JobRoleSelector;