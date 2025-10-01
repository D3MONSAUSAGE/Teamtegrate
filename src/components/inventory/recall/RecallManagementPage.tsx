import React, { useState } from 'react';
import { ScrollableTabs, ScrollableTabsList, ScrollableTabsTrigger } from '@/components/ui/ScrollableTabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, Package, Truck, Factory, Merge } from 'lucide-react';
import { ManufacturingBatchDialog } from './ManufacturingBatchDialog';
import { BatchManagementTable } from './BatchManagementTable';
import { ProductionWorkflowGuide } from './ProductionWorkflowGuide';
import { BulkBatchOperations } from './BulkBatchOperations';
import { ProductionEventLog } from './ProductionEventLog';
import { BatchTraceability } from './BatchTraceability';
import { BatchAnalytics } from './BatchAnalytics';
import { UnifiedLabelModal } from '@/components/inventory/labels/UnifiedLabelModal';
import { ManufacturingBatch } from '@/contexts/inventory/api';
import { toast } from 'sonner';

export const RecallManagementPage: React.FC = () => {
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [bulkOpsOpen, setBulkOpsOpen] = useState(false);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<ManufacturingBatch | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [batches, setBatches] = useState<ManufacturingBatch[]>([]);
  const [activeTab, setActiveTab] = useState('batches');

  const handlePrintLabels = (batch: ManufacturingBatch) => {
    setSelectedBatch(batch);
    setLabelModalOpen(true);
    toast.success('Opening label generator...');
  };

  const handleBatchCreated = () => {
    setBatchDialogOpen(false);
    setRefreshKey(prev => prev + 1);
    toast.success('Manufacturing batch created successfully!');
  };

  const handleBatchesLoaded = (loadedBatches: ManufacturingBatch[]) => {
    setBatches(loadedBatches);
  };

  const handleBulkOpsSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <ScrollableTabs className="space-y-4">
        <ScrollableTabsList>
          <ScrollableTabsTrigger 
            isActive={activeTab === 'batches'}
            onClick={() => setActiveTab('batches')}
          >
            <Package className="h-4 w-4 mr-2" />
            Batches
          </ScrollableTabsTrigger>
          <ScrollableTabsTrigger 
            isActive={activeTab === 'workflow'}
            onClick={() => setActiveTab('workflow')}
          >
            <Factory className="h-4 w-4 mr-2" />
            Workflow
          </ScrollableTabsTrigger>
          <ScrollableTabsTrigger 
            isActive={activeTab === 'events'}
            onClick={() => setActiveTab('events')}
          >
            <Factory className="h-4 w-4 mr-2" />
            Events
          </ScrollableTabsTrigger>
          <ScrollableTabsTrigger 
            isActive={activeTab === 'traceability'}
            onClick={() => setActiveTab('traceability')}
          >
            <Truck className="h-4 w-4 mr-2" />
            Traceability
          </ScrollableTabsTrigger>
          <ScrollableTabsTrigger 
            isActive={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          >
            <Package className="h-4 w-4 mr-2" />
            Analytics
          </ScrollableTabsTrigger>
          <ScrollableTabsTrigger 
            isActive={activeTab === 'distributions'}
            onClick={() => setActiveTab('distributions')}
          >
            <Truck className="h-4 w-4 mr-2" />
            Distributions
          </ScrollableTabsTrigger>
          <ScrollableTabsTrigger 
            isActive={activeTab === 'recalls'}
            onClick={() => setActiveTab('recalls')}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Recalls
          </ScrollableTabsTrigger>
        </ScrollableTabsList>

        {activeTab === 'batches' && (
          <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center gap-4">
                <div className="text-center">
                  <CardTitle>Manufacturing Batches</CardTitle>
                  <CardDescription>
                    Track production runs, quantities, and lot associations
                  </CardDescription>
                </div>
                <div className="flex flex-col items-center gap-2 w-full sm:w-auto">
                  <Button onClick={() => setBatchDialogOpen(true)} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    New Batch
                  </Button>
                  <Button variant="outline" onClick={() => setBulkOpsOpen(true)} className="w-full sm:w-auto">
                    <Merge className="mr-2 h-4 w-4" />
                    Bulk Operations
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <BatchManagementTable 
                key={refreshKey} 
                onPrintLabels={handlePrintLabels}
                onBatchesLoad={handleBatchesLoaded}
              />
            </CardContent>
          </Card>
        </div>
        )}

        {activeTab === 'workflow' && (
          <div className="space-y-4">
            <ProductionWorkflowGuide />
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            <ProductionEventLog />
          </div>
        )}

        {activeTab === 'traceability' && (
          <div className="space-y-4">
            <BatchTraceability />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <BatchAnalytics />
          </div>
        )}

        {activeTab === 'distributions' && (
          <div className="space-y-4">
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
          </div>
        )}

        {activeTab === 'recalls' && (
          <div className="space-y-4">
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
          </div>
        )}
      </ScrollableTabs>

      <ManufacturingBatchDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        onSuccess={handleBatchCreated}
      />

      <BulkBatchOperations
        open={bulkOpsOpen}
        onOpenChange={setBulkOpsOpen}
        batches={batches}
        onSuccess={handleBulkOpsSuccess}
      />

      <UnifiedLabelModal
        open={labelModalOpen}
        onOpenChange={(open) => {
          setLabelModalOpen(open);
          if (!open) {
            setRefreshKey(prev => prev + 1); // Refresh batch list after printing
          }
        }}
        batchData={selectedBatch ? {
          batchId: selectedBatch.id,
          batchNumber: selectedBatch.batch_number,
          itemId: selectedBatch.inventory_lot?.item_id,
          lotId: selectedBatch.lot_id,
          lotNumber: selectedBatch.inventory_lot?.lot_number,
          itemName: selectedBatch.inventory_item?.name,
          maxQuantity: selectedBatch.quantity_remaining,
        } : undefined}
      />
    </div>
  );
};
