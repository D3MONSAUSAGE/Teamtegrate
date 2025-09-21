import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useInventory } from '@/contexts/inventory';
import { inventoryCountsApi } from '@/contexts/inventory/api';
import { InventoryCountItem, InventoryTemplate } from '@/contexts/inventory/types';
import { Package, Play, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TemplateCountSelectionDialog } from '../TemplateCountSelectionDialog';
import { BatchCountInterface } from '../BatchCountInterface';


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
      const countName = template 
        ? selectedTeam 
          ? `Count for ${selectedTeam.name}: ${template.name}`
          : `Count from template: ${template.name}` 
        : 'Manual inventory count';
      
      const count = await startInventoryCount(countName);
      setActiveCount(count.id);
      setActiveTemplate(template || null);
      
      if (template) {
        // Initialize count with template items
        await initializeCountItems(count.id, template.id);
        // Load template items
        const items = await inventoryCountsApi.getTemplateItems(template.id);
        setTemplateItems(items);
      }
      
      await loadCountItems(count.id);
      
      toast({
        title: 'Count Started',
        description: `Started counting ${template ? `template "${template.name}"` : 'all items'}${selectedTeam ? ` for ${selectedTeam.name}` : ''}`,
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

  if (!activeCount) {
    return (
      <div className="space-y-6">
        {/* Recent Counts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Recent Inventory Counts
            </CardTitle>
            <CardDescription>
              View recent inventory counts and start a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {counts.slice(0, 5).map((count) => (
                <div key={count.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      Count from {new Date(count.count_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {count.notes || 'No notes provided'}
                    </p>
                  </div>
                  <Badge variant={count.status === 'completed' ? 'default' : 'secondary'}>
                    {count.status === 'completed' ? 'Completed' : 'In Progress'}
                  </Badge>
                </div>
              ))}
              
              {counts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No inventory counts yet</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t space-y-3">
              <TemplateCountSelectionDialog onStartCount={handleStartCount}>
                <Button className="w-full" size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  Start Count from Template
                </Button>
              </TemplateCountSelectionDialog>
              
              <Button 
                onClick={() => handleStartCount()} 
                variant="outline" 
                className="w-full" 
                size="lg"
              >
                <Package className="h-4 w-4 mr-2" />
                Start Count (All Items)
              </Button>
            </div>
          </CardContent>
        </Card>
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
                Template-based count • {templateItems.length} items
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