import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Copy, EyeOff, Globe } from 'lucide-react';
import { InventoryItem } from '@/contexts/inventory/types';

interface TeamItemActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem;
  teamId?: string;
  onMakeTeamCopy: (item: InventoryItem) => Promise<void>;
  onHideFromTeam: (itemId: string) => Promise<void>;
  onRevertToGlobal: (itemId: string) => Promise<void>;
}

export const TeamItemActionDialog: React.FC<TeamItemActionDialogProps> = ({
  open,
  onOpenChange,
  item,
  teamId,
  onMakeTeamCopy,
  onHideFromTeam,
  onRevertToGlobal,
}) => {
  const [loading, setLoading] = useState(false);
  const isGlobalItem = !item.team_id;
  const isTeamSpecific = !!item.team_id;

  const handleMakeTeamCopy = async () => {
    setLoading(true);
    try {
      await onMakeTeamCopy(item);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleHideFromTeam = async () => {
    setLoading(true);
    try {
      await onHideFromTeam(item.id);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRevertToGlobal = async () => {
    setLoading(true);
    try {
      await onRevertToGlobal(item.id);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Item Management Options
            {isGlobalItem && (
              <Badge variant="secondary" className="gap-1">
                <Globe className="h-3 w-3" />
                Global
              </Badge>
            )}
            {isTeamSpecific && (
              <Badge variant="default" className="gap-1">
                Team-Specific
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Choose how to manage this item for your team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">Item: {item.name}</h4>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>

          {isGlobalItem && teamId && (
            <div className="space-y-3">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Copy className="h-5 w-5 mt-0.5 text-primary" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Make Team-Specific Copy</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Create a customizable copy of this item that only your team can see and edit. The global item remains unchanged for other teams.
                    </p>
                    <Button 
                      onClick={handleMakeTeamCopy} 
                      disabled={loading}
                      className="w-full"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Create Team Copy
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <EyeOff className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Hide from Team Catalog</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Remove this item from your team's view without affecting other teams. You can unhide it later.
                    </p>
                    <Button 
                      onClick={handleHideFromTeam} 
                      disabled={loading}
                      variant="outline"
                      className="w-full"
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide from Catalog
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isTeamSpecific && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 mt-0.5 text-orange-600" />
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Revert to Global Item</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Delete this team-specific copy and revert to using the global item. Your customizations will be lost.
                  </p>
                  <Button 
                    onClick={handleRevertToGlobal} 
                    disabled={loading}
                    variant="destructive"
                    className="w-full"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Revert to Global
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
