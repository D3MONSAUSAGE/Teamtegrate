import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { InventoryItem } from '@/contexts/inventory/types';

interface ItemCardProps {
  item: InventoryItem;
  onClick: (itemId: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onClick }) => {
  const isLowStock = item.current_stock < (item.minimum_threshold || 0);
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow" 
      onClick={() => onClick(item.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm truncate">{item.name}</span>
          </div>
          <Badge variant={isLowStock ? 'destructive' : 'secondary'}>
            {item.current_stock}
          </Badge>
        </div>
        
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="truncate">SKU: {item.sku || 'N/A'}</div>
          <div className="truncate">Category: {item.category?.name || 'Uncategorized'}</div>
          <div className="flex justify-between">
            <span>Min: {item.minimum_threshold || 0}</span>
            <span>Max: {item.maximum_threshold || 0}</span>
          </div>
        </div>
        
        {item.unit_cost && (
          <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
            Cost: ${item.unit_cost.toFixed(2)} per {item.base_unit?.abbreviation || 'unit'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};