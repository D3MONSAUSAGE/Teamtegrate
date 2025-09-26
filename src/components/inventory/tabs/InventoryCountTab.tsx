import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInventory } from '@/contexts/inventory';
import { inventoryCountsApi } from '@/contexts/inventory/api';
import { InventoryCountItem, InventoryTemplate } from '@/contexts/inventory/types';
import { Package, Play, CheckCircle, Clock, X, Smartphone, Tablet, Zap, Camera, Scan } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TemplateCountSelectionDialog } from '../TemplateCountSelectionDialog';
import { ManualCountSelectionDialog } from '../ManualCountSelectionDialog';
import { BatchCountInterface } from '../BatchCountInterface';
import { MobileCountInterface } from '../MobileCountInterface';
import { ScanMode } from '../mobile/ScanMode';
import { ScanGunMode } from '../modes/ScanGunMode';
import { MobileScanMode } from '../modes/MobileScanMode';
import { ScrollableTabs, ScrollableTabsList, ScrollableTabsTrigger } from '@/components/ui/ScrollableTabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery } from '@tanstack/react-query';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format, isToday, differenceInMinutes } from 'date-fns';
import { useScanEngineV2 } from '@/hooks/useScanEngineV2';

type CountInterface = 'batch' | 'mobile' | 'scan' | 'scangun';


export const InventoryCountTab: React.FC = () => {
  const { 
    items, 
    templates, 
    categories,
    units,
    startInventoryCount, 
    completeInventoryCount, 
    cancelInventoryCount, 
    initializeCountItems,
    createItem 
  } = useInventory();
  const { toast } = useToast();
  const scanEngineV2 = useScanEngineV2();
  
  const [activeCount, setActiveCount] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<InventoryTemplate | null>(null);
  const [templateItems, setTemplateItems] = useState<any[]>([]);
  const [loadingCountItems, setLoadingCountItems] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [countInterface, setCountInterface] = useState<CountInterface>('batch');

  const { data: counts, isLoading: countsLoading, refetch: refetchCounts } = useQuery({
    queryKey: ['inventory-counts'],
    queryFn: inventoryCountsApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const { data: countItems = [], isLoading: itemsLoading, refetch: refetchItems } = useQuery({
    queryKey: ['inventory-count-items', activeCount],
    queryFn: () => inventoryCountsApi.getCountItems(activeCount || ''),
    enabled: !!activeCount,
    staleTime: 5000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });

  // Call scanEngineV2.onItemsRefetched when countItems changes
  useEffect(() => {
    if (countItems && countItems.length > 0) {
      const mappedItems = countItems.map(item => ({
        id: item.id,
        actual_quantity: item.actual_quantity || 0
      }));
      scanEngineV2.onItemsRefetched(mappedItems);
    }
  }, [countItems, scanEngineV2]);
  

  const activeCountRecord = (counts || []).find(c => c.id === activeCount && c.status === 'in_progress');

  // Define handleItemCreated early to ensure it's available
  const handleItemCreated = async (itemData: any) => {
    try {
      const newItem = await createItem(itemData);
      if (newItem) {
        toast({ title: "Item created", description: `${newItem.name} has been added to inventory` });
      // Trigger React Query refetch instead of loadCountItems
      refetchItems();
      }
    } catch (error) {
      console.error('Failed to create item:', error);
      toast({ title: "Error", description: "Failed to create item", variant: "destructive" });
    }
  };
  
  // Use template items when in a template-based count, otherwise use all items
  const countableItems = activeTemplate && templateItems.length > 0 
    ? templateItems.map(ti => items.find(item => item.id === ti.item_id)).filter(Boolean)
    : items;

  const handleStartCount = async (template?: InventoryTemplate, selectedTeam?: { id: string; name: string }) => {
    try {
      // Validate template has items before starting count
      if (template) {
        const templateItems = await inventoryCountsApi.getTemplateItems(template.id);
        if (!templateItems || templateItems.length === 0) {
          toast({
            title: 'Template Empty',
            description: `Template "${template.name}" has no items. Please add items to the template before starting a count.`,
            variant: 'destructive',
          });
          return;
        }
        setTemplateItems(templateItems);
      }

      const countName = template 
        ? selectedTeam 
          ? `Count for ${selectedTeam.name}: ${template.name}`
          : `Count from template: ${template.name}` 
        : selectedTeam
        ? `Manual count for ${selectedTeam.name}`
        : 'Manual inventory count';
      
      // Pass template ID to startInventoryCount
      const count = await startInventoryCount(countName, selectedTeam?.id, template?.id);
      setActiveCount(count.id);
      setActiveTemplate(template || null);
      
      // Initialize count items with proper template ID
      if (template) {
        await inventoryCountsApi.initializeCountItems(count.id, template.id);
      } else {
        await inventoryCountsApi.initializeCountItems(count.id);
      }
      
      // Trigger React Query refetch
      refetchItems();
      
      toast({
        title: 'Count Started',
        description: `Started counting ${template ? `template "${template.name}" with ${templateItems?.length || '0'} items` : 'all items'}${selectedTeam ? ` for ${selectedTeam.name}` : ''}`,
      });
    } catch (error) {
      console.error('Failed to start count:', error);
      toast({
        title: 'Error',
        description: 'Failed to start inventory count',
        variant: 'destructive',
      });
    }
  };

  const loadCountItems = async (countId: string) => {
    setLoadingCountItems(true);
    try {
      const items = await inventoryCountsApi.getCountItems(countId);
      // Items are now handled by React Query
      refetchItems();
    } catch (error) {
      console.error('Failed to load count items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load count items',
        variant: 'destructive',
      });
    } finally {
      setLoadingCountItems(false);
    }
  };

  const handleUpdateCount = async (itemId: string, actualQuantity: number) => {
    if (!activeCount) return;
    
    try {
      const result = await inventoryCountsApi.bulkUpdateCountItems(activeCount, [{ itemId, actualQuantity }]);
      
      // Update via React Query refetch - optimistic update removed
      refetchItems();
    } catch (error) {
      console.error('Failed to update count:', error);
      toast({
        title: 'Error',
        description: 'Failed to update inventory count',
        variant: 'destructive',
      });
    }
  };

  const handleBulkUpdateCount = async (updates: Array<{ itemId: string; actualQuantity: number }>) => {
    if (!activeCount) return;
    
    try {
      const result = await inventoryCountsApi.bulkUpdateCountItems(activeCount, updates);
      
      // Update via React Query refetch - optimistic update removed
      refetchItems();
      
      // Show appropriate toast based on results
      if (result.failed.length === 0) {
        toast({
          title: 'Success',
          description: `Updated ${result.saved} item${result.saved > 1 ? 's' : ''}`,
        });
      } else {
        toast({
          title: 'Partial Success',
          description: `Saved ${result.saved}/${updates.length} items. ${result.failed.length} failed.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to update counts:', error);
      toast({
        title: 'Error',
        description: 'Failed to update inventory counts',
        variant: 'destructive',
      });
      throw error; // Re-throw to let the component handle loading state
    }
  };

  // Wrapper for ScanMode that matches its expected signature
  const handleScanModeUpdateCount = async (countId: string, itemId: string, actualQuantity: number, notes?: string) => {
    try {
      await inventoryCountsApi.updateCountItem(countId, itemId, actualQuantity, notes);
      
      // Update via React Query refetch - optimistic update removed
      refetchItems();
    } catch (error) {
      console.error('Failed to update count:', error);
      throw error; // Let ScanMode handle the error
    }
  };


  const handleCancelCount = async () => {
    if (!activeCount) return;
    
    try {
      await cancelInventoryCount(activeCount, cancelReason || undefined);
      setActiveCount(null);
      setActiveTemplate(null);
      setTemplateItems([]);
      setCancelReason('');
      toast({
        title: 'Success',
        description: 'Inventory count cancelled successfully',
      });
    } catch (error) {
      console.error('Failed to cancel count:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel inventory count',
        variant: 'destructive',
      });
    }
  };

  const handleCompleteCount = async () => {
    if (!activeCount) return;
    
    try {
      await completeInventoryCount(activeCount);
      setActiveCount(null);
      setActiveTemplate(null);
      setTemplateItems([]);
      toast({
        title: 'Success',
        description: 'Inventory count completed successfully',
      });
    } catch (error) {
      console.error('Failed to complete count:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete inventory count',
        variant: 'destructive',
      });
    }
  };


  // Auto-detect mobile device
  const isMobile = useIsMobile();
  useEffect(() => {
    if (isMobile && countInterface === 'batch') {
      setCountInterface('scangun'); // Default mobile users to scan-gun mode
    }
  }, [isMobile, countInterface]);

  useEffect(() => {
    // Check if there's an active count on load
    const inProgressCount = (counts || []).find(c => c.status === 'in_progress');
    if (inProgressCount) {
      setActiveCount(inProgressCount.id);
      loadCountItems(inProgressCount.id);
    }
  }, [counts]);

  // Filter counts for today only
  const todayCounts = (counts || []).filter(count => isToday(new Date(count.created_at)));
  
  const formatExecutionTime = (count: any) => {
    const startTime = format(new Date(count.created_at), 'MMM dd, yyyy \'at\' h:mm a');
    if (count.status === 'completed' && count.updated_at) {
      const endTime = format(new Date(count.updated_at), 'h:mm a');
      const duration = differenceInMinutes(new Date(count.updated_at), new Date(count.created_at));
      return `Started: ${startTime}, Completed: ${endTime} (${duration}min)`;
    }
    return `Started: ${startTime}`;
  };

  if (!activeCount) {
    return (
      <div className="space-y-6">
        {/* Start Count Actions - Moved to Top */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Start New Count
            </CardTitle>
            <CardDescription>
              Begin a new inventory count using templates or all items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <TemplateCountSelectionDialog onStartCount={handleStartCount}>
                <Button className="w-full" size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  Start Count from Template
                </Button>
              </TemplateCountSelectionDialog>
              
              <ManualCountSelectionDialog onStartCount={(selectedTeam) => handleStartCount(undefined, selectedTeam)}>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="lg"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Start Manual Count
                </Button>
              </ManualCountSelectionDialog>
            </div>
          </CardContent>
        </Card>

        {/* Daily Inventory Counts */}
        {todayCounts.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Daily Inventory Counts
              </CardTitle>
              <CardDescription>
                Inventory counts started today
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayCounts.length <= 5 ? (
                <div className="space-y-3">
                  {todayCounts.map((count) => (
                    <div key={count.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">
                              {count.notes || `Count ${count.id.slice(0, 8)}`}
                            </p>
                            <Badge variant={count.status === 'completed' ? 'default' : 'secondary'}>
                              {count.status === 'completed' ? 'Completed' : 'In Progress'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatExecutionTime(count)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {todayCounts.map((count) => (
                      <div key={count.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">
                                {count.notes || `Count ${count.id.slice(0, 8)}`}
                              </p>
                              <Badge variant={count.status === 'completed' ? 'default' : 'secondary'}>
                                {count.status === 'completed' ? 'Completed' : 'In Progress'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatExecutionTime(count)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">No inventory counts today</p>
              <p className="text-sm text-muted-foreground mt-1">Start a new count to begin tracking</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const completedItems = countItems.filter(item => item.actual_quantity !== null).length;
  const totalItems = countItems.length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Count Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {activeTemplate ? `Counting: ${activeTemplate.name}` : 'Active Inventory Count'}
            </span>
            <Badge variant="secondary">In Progress</Badge>
          </CardTitle>
            <CardDescription>
              Count started on {new Date(activeCountRecord?.count_date || '').toLocaleDateString()}
              {activeTemplate && (
                <span className="block text-xs mt-1">
                  Template-based count: "{activeTemplate.name}" • {templateItems.length} items
                </span>
              )}
            </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedItems} of {totalItems} items counted
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="flex flex-col gap-2 sm:flex-row mt-6">
              <Button 
                onClick={handleCompleteCount}
                disabled={completedItems === 0}
                className="w-full sm:flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Count
              </Button>
              
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="default" className="w-full sm:w-auto">
                    <X className="h-4 w-4 mr-2" />
                    Cancel Count
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Inventory Count</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this inventory count? This action cannot be undone and no stock will be updated.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="cancel-reason">Cancellation Reason (Optional)</Label>
                    <Textarea
                      id="cancel-reason"
                      placeholder="Enter reason for cancellation..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setCancelReason('')}>Keep Counting</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelCount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Cancel Count
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            {/* Interface Selection */}
            <div className="border-t pt-4 mt-6">
              <p className="text-sm font-medium mb-3">Count Interface:</p>
              <ScrollableTabs>
                <ScrollableTabsList>
                  <ScrollableTabsTrigger
                    isActive={countInterface === 'batch'}
                    onClick={() => setCountInterface('batch')}
                    className="text-xs"
                  >
                    <Tablet className="h-3 w-3 mr-1" />
                    Batch
                  </ScrollableTabsTrigger>
                  <ScrollableTabsTrigger
                    isActive={countInterface === 'mobile'}
                    onClick={() => setCountInterface('mobile')}
                    className="text-xs"
                  >
                    <Smartphone className="h-3 w-3 mr-1" />
                    Mobile
                  </ScrollableTabsTrigger>
                  <ScrollableTabsTrigger
                    isActive={countInterface === 'scan'}
                    onClick={() => setCountInterface('scan')}
                    className="text-xs"
                  >
                    <Camera className="h-3 w-3 mr-1" />
                    Camera
                  </ScrollableTabsTrigger>
                  <ScrollableTabsTrigger
                    isActive={countInterface === 'scangun'}
                    onClick={() => setCountInterface('scangun')}
                    className="text-xs"
                  >
                    <Scan className="h-3 w-3 mr-1" />
                    Scan-Gun
                  </ScrollableTabsTrigger>
                </ScrollableTabsList>
              </ScrollableTabs>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Count Interface */}
      {countInterface === 'batch' && (
        <BatchCountInterface
          countId={activeCount}
          countItems={countItems}
          items={countableItems}
          onBulkUpdate={handleBulkUpdateCount}
          onCompleteCount={handleCompleteCount}
          progress={progress}
          completedItems={completedItems}
          totalItems={totalItems}
          isLoading={loadingCountItems}
        />
      )}

      {countInterface === 'mobile' && (
        <MobileScanMode
          countId={activeCount!}
          countItems={countItems || []}
          items={countableItems}
          onUpdateCount={handleScanModeUpdateCount}
          onComplete={handleCompleteCount}
        />
      )}

      {countInterface === 'scan' && (
        <ScanMode
          countId={activeCount!}
          countItems={countItems || []}
          items={countableItems}
          onUpdateCount={handleScanModeUpdateCount}
          onComplete={handleCompleteCount}
        />
      )}

      {countInterface === 'scangun' && (
        <ScanGunMode
          countId={activeCount!}
          countItems={countItems || []}
          items={countableItems}
          onUpdateCount={handleScanModeUpdateCount}
          onComplete={handleCompleteCount}
          onItemsRefetched={(items) => {
            // Wire up the V2 engine refetch callback if it exists
            // This will be handled in ScanGunMode itself
          }}
        />
      )}
    </div>
  );
};