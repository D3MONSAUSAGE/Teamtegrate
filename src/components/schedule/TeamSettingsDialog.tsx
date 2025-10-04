import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Shield, Info } from 'lucide-react';
import { Team } from '@/types/teams';
import { useTeamManagement } from '@/hooks/organization/useTeamManagement';

interface TeamSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
  organizationRequiresSchedule?: boolean;
}

export const TeamSettingsDialog = ({ 
  open, 
  onOpenChange, 
  team,
  organizationRequiresSchedule = false 
}: TeamSettingsDialogProps) => {
  const { updateTeam, isUpdating } = useTeamManagement();
  const [requireSchedule, setRequireSchedule] = useState<boolean | null>(
    team?.require_schedule_for_clock_in ?? null
  );

  const handleSave = async () => {
    if (!team) return;

    try {
      await updateTeam(team.id, {
        require_schedule_for_clock_in: requireSchedule,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update team settings:', error);
    }
  };

  const effectiveSetting = requireSchedule ?? organizationRequiresSchedule;
  const isInherited = requireSchedule === null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Team Settings: {team?.name}
          </DialogTitle>
          <DialogDescription>
            Configure team-specific policies and settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="require-schedule" className="text-base font-medium">
                  Require Schedule for Clock-In
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isInherited 
                    ? `Currently inheriting organization setting (${organizationRequiresSchedule ? 'Required' : 'Not Required'})`
                    : 'Using team-specific override'}
                </p>
              </div>
              <Switch
                id="require-schedule"
                checked={requireSchedule ?? organizationRequiresSchedule}
                onCheckedChange={(checked) => setRequireSchedule(checked)}
              />
            </div>

            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-primary mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium">Policy Inheritance</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Toggle off to inherit from organization settings</li>
                    <li>Toggle on to override with team-specific policy</li>
                    <li>When enabled: Team members must have scheduled shifts to clock in</li>
                    <li>When disabled: Team members can clock in without scheduled shifts</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Current effective setting:</span>
              <span className={`font-medium ${effectiveSetting ? 'text-warning' : 'text-success'}`}>
                {effectiveSetting ? 'Schedule Required' : 'Clock-In Allowed Without Schedule'}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
