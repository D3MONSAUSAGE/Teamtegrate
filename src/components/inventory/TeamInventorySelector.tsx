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
    onChange(newValue);
  };

  return (
    <div className={className}>
      {label && <Label>{label}</Label>}
      <Select 
        value={value || ''} 
        onValueChange={handleValueChange}
        disabled={disabled || availableTeams.length === 0}
      >
        <SelectTrigger>
          <SelectValue placeholder={availableTeams.length === 0 ? "No teams available" : placeholder} />
        </SelectTrigger>
        <SelectContent>
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
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-1">
        This item will only be visible to members of the selected team{isAdmin ? ' (Admins can see all teams)' : ''}.
      </p>
    </div>
  );
};