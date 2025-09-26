import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Package, Loader2 } from 'lucide-react';
import { warehouseApi } from '@/contexts/warehouse/api/warehouseApi';
import { useTeamAccess } from '@/hooks/useTeamAccess';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface NotConfiguredProps {
  onConfigured: () => void;
  selectedTeamId?: string | null;
}

export const NotConfigured: React.FC<NotConfiguredProps> = ({ onConfigured, selectedTeamId }) => {
  const [loading, setLoading] = useState(false);
  const { availableTeams, isManager, isAdmin, isSuperAdmin } = useTeamAccess();

  const handleSetup = async () => {
    try {
      setLoading(true);
      
      // Determine which team to assign warehouse to
      let teamId: string | undefined;
      if (selectedTeamId) {
        // Admin/superadmin setting up for specific team
        teamId = selectedTeamId;
      } else if (isManager && availableTeams.length === 1) {
        // Manager with single team
        teamId = availableTeams[0].id;
      }
      
      const teamName = teamId ? availableTeams.find(t => t.id === teamId)?.name : undefined;
      const warehouseName = teamName ? `${teamName} Warehouse` : 'Main Warehouse';
      
      await warehouseApi.ensurePrimaryWarehouse(warehouseName, teamId);
      toast.success(`Warehouse configured successfully${teamName ? ` for ${teamName}` : ''}`);
      onConfigured();
    } catch (error: any) {
      console.error('Error setting up warehouse:', error);
      const message = error?.message || 'Failed to configure warehouse';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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
              onClick={handleSetup} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Setting up...' : 'Setup Warehouse'}
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