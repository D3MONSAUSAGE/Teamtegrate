import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Warehouse, ChevronRight, Package, CheckCircle, Loader2 } from 'lucide-react';
import { warehouseApi } from '@/contexts/warehouse/api/warehouseApi';
import { toast } from 'sonner';
import { WarehouseItemSelector } from './WarehouseItemSelector';

interface WarehouseSetupWizardProps {
  onComplete: () => void;
  selectedTeamId?: string | null;
  teamName?: string;
}

type SetupStep = 'warehouse' | 'inventory' | 'complete';

export const WarehouseSetupWizard: React.FC<WarehouseSetupWizardProps> = ({
  onComplete,
  selectedTeamId,
  teamName
}) => {
  const [currentStep, setCurrentStep] = useState<SetupStep>('warehouse');
  const [loading, setLoading] = useState(false);
  const [warehouseName, setWarehouseName] = useState(
    teamName ? `${teamName} Warehouse` : 'Main Warehouse'
  );
  const [createdWarehouse, setCreatedWarehouse] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<Array<{
    itemId: string;
    name: string;
    sku?: string;
    qty: number;
    unitCost: number;
  }>>([]);

  const handleCreateWarehouse = async () => {
    try {
      setLoading(true);
      
      console.log('📦 Creating warehouse with teamId:', selectedTeamId, 'name:', warehouseName);
      
      // Create team-specific warehouse instead of primary warehouse
      let warehouse;
      if (selectedTeamId) {
        console.log('✅ Creating team warehouse for team:', selectedTeamId);
        warehouse = await warehouseApi.createTeamWarehouse(warehouseName, selectedTeamId);
        console.log('✅ Created team warehouse:', warehouse);
      } else {
        console.log('⚠️ No team ID provided - creating primary warehouse');
        warehouse = await warehouseApi.ensurePrimaryWarehouse(warehouseName);
      }
      
      // Verify warehouse was created with correct team_id
      if (selectedTeamId && warehouse.team_id !== selectedTeamId) {
        console.error('❌ WAREHOUSE TEAM MISMATCH:', {
          expected: selectedTeamId,
          actual: warehouse.team_id,
          warehouse
        });
        throw new Error('Warehouse was created but team association failed. Please try again.');
      }
      
      console.log('✅ Warehouse created successfully:', warehouse);
      setCreatedWarehouse(warehouse);
      toast.success(`${warehouseName} created successfully`);
      setCurrentStep('inventory');
    } catch (error: any) {
      console.error('❌ Error creating warehouse:', error);
      toast.error(error?.message || 'Failed to create warehouse');
    } finally {
      setLoading(false);
    }
  };

  const handleInventorySetup = async () => {
    if (selectedItems.length === 0) {
      setCurrentStep('complete');
      return;
    }

    try {
      setLoading(true);
      
      // Add all selected items directly to warehouse using new receive_stock function
      const items = selectedItems.map(item => ({
        item_id: item.itemId,
        quantity: item.qty,
        unit_cost: item.unitCost,
        notes: 'Initial Setup'
      }));
      
      // Receive stock using new function
      const result = await warehouseApi.receiveStock(createdWarehouse.id, items);
      
      toast.success(`Added ${selectedItems.length} items to warehouse inventory!`);
      setCurrentStep('complete');
    } catch (error: any) {
      console.error('Error setting up inventory:', error);
      toast.error(error?.message || 'Failed to add items to warehouse');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    console.log('✅ Warehouse setup complete, transitioning back to main view');
    toast.success('Warehouse setup completed successfully!');
    // Add a brief delay to ensure database consistency before transitioning
    await new Promise(resolve => setTimeout(resolve, 800));
    onComplete();
  };

  const stepNumber = currentStep === 'warehouse' ? 1 : currentStep === 'inventory' ? 2 : 3;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            stepNumber >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            {stepNumber > 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
          </div>
          <ChevronRight className={`h-4 w-4 ${stepNumber >= 2 ? 'text-primary' : 'text-muted-foreground'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            stepNumber >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            {stepNumber > 2 ? <CheckCircle className="h-4 w-4" /> : '2'}
          </div>
          <ChevronRight className={`h-4 w-4 ${stepNumber >= 3 ? 'text-primary' : 'text-muted-foreground'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            stepNumber >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            {stepNumber >= 3 ? <CheckCircle className="h-4 w-4" /> : '3'}
          </div>
        </div>
      </div>

      {currentStep === 'warehouse' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Step 1: Create Warehouse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="warehouse-name">Warehouse Name</Label>
              <Input
                id="warehouse-name"
                value={warehouseName}
                onChange={(e) => setWarehouseName(e.target.value)}
                placeholder="Enter warehouse name"
              />
            </div>
            
            {teamName && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Setting up warehouse for: <strong>{teamName}</strong>
                </p>
              </div>
            )}

            <Button onClick={handleCreateWarehouse} disabled={loading || !warehouseName.trim()} className="w-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {loading ? 'Creating...' : 'Create Warehouse'}
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 'inventory' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Step 2: Add Initial Inventory (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Select items from your master inventory list to add to this warehouse with initial quantities and costs.
            </p>
            
            <WarehouseItemSelector
              selectedItems={selectedItems}
              onSelectionChange={setSelectedItems}
            />

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleInventorySetup()}
                className="flex-1"
              >
                Skip for Now
              </Button>
              <Button onClick={handleInventorySetup} disabled={loading} className="flex-1">
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {loading ? 'Adding Items...' : `Add ${selectedItems.length} Items`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Setup Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="space-y-2">
              <p className="text-lg font-medium">🎉 {warehouseName} is ready!</p>
              <p className="text-muted-foreground">
                {selectedItems.length > 0 
                  ? `Added ${selectedItems.length} items to your warehouse inventory.`
                  : 'You can now start receiving inventory items.'
                }
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Next steps:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use "Receive Inventory" to add more inventory</li>
                <li>• Create purchase orders and receipts</li>
                <li>• Transfer items between teams</li>
              </ul>
            </div>

            <Button onClick={handleComplete} className="w-full">
              Go to Warehouse Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};