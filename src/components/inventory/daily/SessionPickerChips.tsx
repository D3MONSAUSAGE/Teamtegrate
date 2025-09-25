import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Clock, CheckCircle, PlayCircle, XCircle } from 'lucide-react';
import { formatInTZ } from '@/lib/dates/tzRange';
import { cn } from '@/lib/utils';

export interface SessionChip {
  id: string;
  name?: string;
  status: 'in_progress' | 'completed' | 'voided';
  startedAt: string;
  teamId?: string;
}

interface SessionPickerChipsProps {
  sessionChips: SessionChip[];
  selectedSessions: Set<string>;
  onSessionSelect: (sessionIds: Set<string>) => void;
  includeVoided: boolean;
  onIncludeVoidedChange: (include: boolean) => void;
  timezone: string;
  totalSessions: number;
  completedSessions: number;
}

export const SessionPickerChips: React.FC<SessionPickerChipsProps> = ({
  sessionChips,
  selectedSessions,
  onSessionSelect,
  includeVoided,
  onIncludeVoidedChange,
  timezone,
  totalSessions,
  completedSessions
}) => {
  const handleChipClick = (chipId: string) => {
    const newSelection = new Set(selectedSessions);
    
    if (chipId === 'COMBINE') {
      // If Combine All is selected, clear all others
      onSessionSelect(new Set(['COMBINE']));
    } else {
      // If any individual session is selected, remove Combine All
      newSelection.delete('COMBINE');
      
      if (newSelection.has(chipId)) {
        newSelection.delete(chipId);
      } else {
        newSelection.add(chipId);
      }
      
      // If no sessions are selected, default to Combine All
      if (newSelection.size === 0) {
        newSelection.add('COMBINE');
      }
      
      onSessionSelect(newSelection);
    }
  };

  const getStatusIcon = (status: SessionChip['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'in_progress':
        return <PlayCircle className="h-3 w-3" />;
      case 'voided':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: SessionChip['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'voided':
        return 'text-gray-500 bg-gray-100 border-gray-300';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  const formatSessionTime = (startedAt: string) => {
    return formatInTZ(startedAt, timezone, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-4 border-b pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Today's sessions: {totalSessions} ({completedSessions} completed) • Times in {timezone}
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            id="include-voided"
            checked={includeVoided}
            onCheckedChange={onIncludeVoidedChange}
          />
          <Label htmlFor="include-voided" className="text-sm">
            Include voided
          </Label>
        </div>
      </div>

      {/* Session Chips */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {/* Combine All Chip */}
          <Button
            variant={selectedSessions.has('COMBINE') ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleChipClick('COMBINE')}
            className="flex-shrink-0"
          >
            Combine All
          </Button>

          {/* Individual Session Chips */}
          {sessionChips.map((chip) => (
            <Button
              key={chip.id}
              variant={selectedSessions.has(chip.id) ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChipClick(chip.id)}
              className={cn(
                "flex-shrink-0 flex items-center gap-2",
                selectedSessions.has(chip.id) ? '' : getStatusColor(chip.status)
              )}
            >
              {getStatusIcon(chip.status)}
              <span>{formatSessionTime(chip.startedAt)}</span>
              <Badge variant="secondary" className="text-xs px-1 py-0">
                {chip.status.replace('_', ' ')}
              </Badge>
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Selection Summary */}
      {selectedSessions.size > 1 && !selectedSessions.has('COMBINE') && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Combining {selectedSessions.size} sessions
          </Badge>
        </div>
      )}

      {/* Mobile Legend */}
      <div className="sm:hidden flex flex-wrap gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-green-600" />
          Completed
        </div>
        <div className="flex items-center gap-1">
          <PlayCircle className="h-3 w-3 text-blue-600" />
          In Progress
        </div>
        <div className="flex items-center gap-1">
          <XCircle className="h-3 w-3 text-gray-500" />
          Voided
        </div>
      </div>
    </div>
  );
};