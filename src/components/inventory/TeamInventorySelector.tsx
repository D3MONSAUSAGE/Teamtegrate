import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTeamAccess } from '@/hooks/useTeamAccess';

interface TeamInventorySelectorProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const TeamInventorySelector: React.FC<TeamInventorySelectorProps> = ({
  value,
  onChange,
  label = "Team Access",
  placeholder = "Select team access",
  disabled = false,
  className
}) => {
  const { availableTeams, isAdmin, isManager } = useTeamAccess();

  const handleValueChange = (newValue: string) => {
    onChange(newValue === 'all' ? null : newValue);
  };

  return (
    <div className={className}>
      {label && <Label>{label}</Label>}
      <Select 
        value={value || 'all'} 
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            All Teams (Available to everyone)
          </SelectItem>
          {availableTeams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name}
              {team.description && (
                <span className="text-muted-foreground text-xs block">
                  {team.description}
                </span>
              )}
            </SelectItem>
          ))}
          {availableTeams.length === 0 && !isAdmin && (
            <SelectItem value="no-teams" disabled>
              No teams available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-1">
        {value === null || value === 'all'
          ? "This item will be available to all teams in your organization"
          : `This item will only be available to the selected team${isAdmin ? ' and admins' : ''}`
        }
      </p>
    </div>
  );
};