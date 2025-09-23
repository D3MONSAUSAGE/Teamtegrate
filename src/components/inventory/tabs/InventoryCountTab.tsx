import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInventory } from '@/contexts/inventory';
import { inventoryCountsApi } from '@/contexts/inventory/api';
import { InventoryCountItem, InventoryTemplate } from '@/contexts/inventory/types';
import { Package, Play, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TemplateCountSelectionDialog } from '../TemplateCountSelectionDialog';
import { ManualCountSelectionDialog } from '../ManualCountSelectionDialog';
import { BatchCountInterface } from '../BatchCountInterface';
import { format, isToday, differenceInMinutes } from 'date-fns';


export const InventoryCountTab: React.FC = () => {
  const { items, counts, templates, startInventoryCount, completeInventoryCount, initializeCountItems } = useInventory();
  const { toast } = useToast();
  
  const [activeCount, setActiveCount] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<InventoryTemplate | null>(null);
  const [countItems, setCountItems] = useState<InventoryCountItem[]>([]);
  const [templateItems, setTemplateItems] = useState<any[]>([]);
  const [loadingCountItems, setLoadingCountItems] = useState(false);

  const activeCountRecord = counts.find(c => c.id === activeCount && c.status === 'in_progress');
  
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
      
      await loadCountItems(count.id);
      
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
      setCountItems(items);
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

  const handleBulkUpdateCount = async (updates: Array<{ itemId: string; actualQuantity: number }>) => {
    if (!activeCount) return;
    
    try {
      await inventoryCountsApi.bulkUpdateCountItems(activeCount, updates);
      
      // Update local state
      setCountItems(prev => prev.map(item => {
        const update = updates.find(u => u.itemId === item.item_id);
        return update 
          ? { ...item, actual_quantity: update.actualQuantity, counted_at: new Date().toISOString() }
          : item;
      }));
      
      toast({
        title: 'Success',
        description: `Updated ${updates.length} item${updates.length > 1 ? 's' : ''}`,
      });
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


  const handleCompleteCount = async () => {
    if (!activeCount) return;
    
    try {
      await completeInventoryCount(activeCount);
      setActiveCount(null);
      setActiveTemplate(null);
      setCountItems([]);
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

  useEffect(() => {
    // Check if there's an active count on load
    const inProgressCount = counts.find(c => c.status === 'in_progress');
    if (inProgressCount) {
      setActiveCount(inProgressCount.id);
      loadCountItems(inProgressCount.id);
    }
  }, [counts]);

  // Filter counts for today only
  const todayCounts = counts.filter(count => isToday(new Date(count.created_at)));
  
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
            
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={handleCompleteCount}
                disabled={completedItems === 0}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Count
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Batch Count Interface */}
      <BatchCountInterface
        countItems={countItems}
        items={countableItems}
        onBulkUpdate={handleBulkUpdateCount}
        onCompleteCount={handleCompleteCount}
        progress={progress}
        completedItems={completedItems}
        totalItems={totalItems}
        isLoading={loadingCountItems}
      />
    </div>
  );
};