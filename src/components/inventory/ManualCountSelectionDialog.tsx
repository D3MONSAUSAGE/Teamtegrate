import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TeamSelect } from '@/components/ui/team-select';
import { useAuth } from '@/contexts/AuthContext';
import { useTeams } from '@/hooks/useTeams';
import { Package, Users, Play, Shield } from 'lucide-react';

interface ManualCountSelectionDialogProps {
  children: React.ReactNode;
  onStartCount: (selectedTeam?: { id: string; name: string }) => void;
}

export const ManualCountSelectionDialog: React.FC<ManualCountSelectionDialogProps> = ({
  children,
  onStartCount,
}) => {
  const { user } = useAuth();
  const { teams, isLoading: teamsLoading } = useTeams();
  const [open, setOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  const isAdmin = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'superadmin';

  const handleStartCount = () => {
    const teamData = selectedTeam ? teams.find(t => t.id === selectedTeam) : undefined;
    onStartCount(teamData ? { id: teamData.id, name: teamData.name } : undefined);
    setOpen(false);
    setSelectedTeam('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Start Manual Count
            {isAdmin && <Shield className="h-4 w-4 text-blue-500" />}
          </DialogTitle>
          <DialogDescription>
            {isAdmin 
              ? 'Count all items for a specific team or the entire organization.'
              : 'Start counting all active inventory items.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Team Selector for Admins */}
          {isAdmin && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Team (Optional)</label>
              <TeamSelect
                teams={teams}
                isLoading={teamsLoading}
                selectedTeam={selectedTeam}
                onTeamChange={setSelectedTeam}
                optional={true}
              />
              {selectedTeam ? (
                <p className="text-xs text-muted-foreground">
                  Running count for: {teams.find(t => t.id === selectedTeam)?.name}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Leave empty to count for entire organization
                </p>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Package className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Manual Count</p>
              <p className="text-xs text-muted-foreground">
                Count all active inventory items
              </p>
            </div>
          </div>

          <Button 
            onClick={handleStartCount}
            className="w-full"
            size="lg"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Manual Count
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};