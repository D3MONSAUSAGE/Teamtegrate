import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, Loader2 } from 'lucide-react';
import { useTeamAccess } from '@/hooks/useTeamAccess';

export interface UnifiedTeamSelectorProps {
  selectedTeamId: string | null;
  onTeamChange: (teamId: string | null) => void;
  showAllOption?: boolean;
  disabled?: boolean;
  placeholder?: string;
  variant?: 'card' | 'inline' | 'simple';
  className?: string;
  title?: string;
}

export const UnifiedTeamSelector: React.FC<UnifiedTeamSelectorProps> = ({
  selectedTeamId,
  onTeamChange,
  showAllOption = true,
  disabled = false,
  placeholder = 'Select team...',
  variant = 'simple',
  className = '',
  title = 'Team Selection'
}) => {
  const { 
    availableTeams, 
    shouldAutoSelect, 
    isLoading, 
    isAdmin, 
    isManager,
    canManageTeam 
  } = useTeamAccess();

  // Auto-select team for managers with single team (but not for admins)
  React.useEffect(() => {
    if (shouldAutoSelect && selectedTeamId === null) {
      console.log('Auto-selecting team for manager:', availableTeams[0].name);
      onTeamChange(availableTeams[0].id);
    }
  }, [shouldAutoSelect, availableTeams, selectedTeamId, onTeamChange]);

  const handleValueChange = (value: string) => {
    onTeamChange(value === 'all' ? null : value);
  };

  const renderSelector = () => (
    <Select
      value={selectedTeamId || 'all'}
      onValueChange={handleValueChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className={variant === 'inline' ? 'w-48 h-8' : 'w-full'}>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {showAllOption && isAdmin && (
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Teams
            </div>
          </SelectItem>
        )}
        {availableTeams.map((team) => (
          <SelectItem key={team.id} value={team.id}>
            <div className="flex items-center gap-2 w-full">
              <div className="flex items-center gap-2 flex-1">
                <Users className="h-4 w-4" />
                <span>{team.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {canManageTeam(team.id) && (
                  <Badge variant="secondary" className="text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    Manager
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {team.member_count} members
                </Badge>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (isLoading) {
    const loadingContent = (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading teams...</span>
      </div>
    );

    if (variant === 'card') {
      return (
        <Card className={className}>
          <CardContent className="flex items-center justify-center p-6">
            {loadingContent}
          </CardContent>
        </Card>
      );
    }
    return <div className={className}>{loadingContent}</div>;
  }

  if (availableTeams.length === 0) {
    const emptyContent = (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>{isManager ? "No teams assigned to manage" : "No teams available"}</span>
      </div>
    );

    if (variant === 'card') {
      return (
        <Card className={className}>
          <CardContent className="flex items-center justify-center p-6">
            {emptyContent}
          </CardContent>
        </Card>
      );
    }
    return <div className={className}>{emptyContent}</div>;
  }

  // For managers with only one team in card variant, show team name
  if (variant === 'card' && isManager && availableTeams.length === 1) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            {title} - {availableTeams[0].name}
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  // Render based on variant
  switch (variant) {
    case 'card':
      return (
        <Card className={className}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                {title}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Select Team:</span>
                {renderSelector()}
              </div>
            </CardTitle>
          </CardHeader>
        </Card>
      );

    case 'inline':
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <Users className="h-4 w-4 text-muted-foreground" />
          {renderSelector()}
        </div>
      );

    case 'simple':
    default:
      return (
        <div className={className}>
          {renderSelector()}
        </div>
      );
  }
};