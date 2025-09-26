import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Package } from 'lucide-react';
import { useTeamAccess } from '@/hooks/useTeamAccess';
import { WarehouseSetupWizard } from './WarehouseSetupWizard';

interface NotConfiguredProps {
  onConfigured: () => void;
  selectedTeamId?: string | null;
}

export const NotConfigured: React.FC<NotConfiguredProps> = ({ onConfigured, selectedTeamId }) => {
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const { availableTeams, isManager, isAdmin, isSuperAdmin } = useTeamAccess();

  // Get team details for display
  const teamName = selectedTeamId ? availableTeams.find(t => t.id === selectedTeamId)?.name : undefined;

  const handleStartSetup = () => {
    setShowSetupWizard(true);
  };

  const handleSetupComplete = () => {
    setShowSetupWizard(false);
    onConfigured();
  };

  if (showSetupWizard) {
    return (
      <WarehouseSetupWizard
        onComplete={handleSetupComplete}
        selectedTeamId={selectedTeamId}
        teamName={teamName}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Warehouse Stock
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Warehouse Not Configured</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            {selectedTeamId ? (
              <>No warehouse has been set up for this team yet. Create a warehouse to start managing their stock.</>
            ) : (
              <>No warehouse has been set up yet. Create a primary warehouse to start managing stock.</>
            )}
          </p>
          
          {(isManager || isAdmin || isSuperAdmin) ? (
            <Button 
              onClick={handleStartSetup} 
              className="flex items-center gap-2"
            >
              Setup Warehouse
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground">
              Ask a manager or admin to set up the warehouse.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};