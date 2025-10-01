import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, Package, Truck } from 'lucide-react';
import { ManufacturingBatchDialog } from './ManufacturingBatchDialog';
import { BatchManagementTable } from './BatchManagementTable';
import { ManufacturingBatch } from '@/contexts/inventory/api';
import { toast } from 'sonner';

export const RecallManagementPage: React.FC = () => {
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  const handlePrintLabels = (batch: ManufacturingBatch) => {
    // Navigate to label generator with batch data in state
    navigate('/dashboard/inventory/labels', {
      state: {
        batchId: batch.id,
        itemId: batch.inventory_lot?.item_id,
        lotId: batch.lot_id,
        lotNumber: batch.inventory_lot?.lot_number,
        itemName: batch.inventory_item?.name,
        maxQuantity: batch.quantity_remaining,
      }
    });
    toast.success('Redirecting to label generator...');
  };

  const handleBatchCreated = () => {
    setBatchDialogOpen(false);
    setRefreshKey(prev => prev + 1);
    toast.success('Manufacturing batch created successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lot Tracking & Recall Management</h1>
          <p className="text-muted-foreground">
            Complete traceability from manufacturing to distribution
          </p>
        </div>
      </div>

      <Tabs defaultValue="batches" className="space-y-4">
        <TabsList>
          <TabsTrigger value="batches" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Manufacturing Batches
          </TabsTrigger>
          <TabsTrigger value="distributions" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Product Distributions
          </TabsTrigger>
          <TabsTrigger value="recalls" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Recall Notices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manufacturing Batches</CardTitle>
                  <CardDescription>
                    Track production runs, quantities, and lot associations
                  </CardDescription>
                </div>
                <Button onClick={() => setBatchDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Batch
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <BatchManagementTable key={refreshKey} onPrintLabels={handlePrintLabels} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distributions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Distributions</CardTitle>
              <CardDescription>
                Track outbound shipments, customers, and delivery status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Distribution tracking coming soon. Record where products go, which customers receive them,
                and maintain complete delivery records for recall management.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recalls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recall Notices</CardTitle>
              <CardDescription>
                Manage product recalls with full impact analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-900">Recall Management</h4>
                      <p className="text-sm text-amber-800 mt-1">
                        When a recall is initiated, the system will:
                      </p>
                      <ul className="text-sm text-amber-800 mt-2 space-y-1 list-disc list-inside">
                        <li>Identify all affected batches and lots</li>
                        <li>Calculate total affected quantities</li>
                        <li>Track which customers received affected products</li>
                        <li>Provide distribution details with tracking numbers</li>
                        <li>Generate reports for regulatory compliance</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  No active recalls at this time. Full recall management interface coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ManufacturingBatchDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        onSuccess={handleBatchCreated}
      />
    </div>
  );
};
