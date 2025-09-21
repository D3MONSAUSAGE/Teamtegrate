import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { InventoryItem } from '@/contexts/inventory/types';

interface ItemTableRowProps {
  item: InventoryItem;
  onClick: (itemId: string) => void;
}

export const ItemTableRow: React.FC<ItemTableRowProps> = ({ item, onClick }) => {
  const isLowStock = item.current_stock < (item.minimum_threshold || 0);
  
  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50" 
      onClick={() => onClick(item.id)}
    >
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell>{item.sku || 'N/A'}</TableCell>
      <TableCell>{item.category?.name || 'Uncategorized'}</TableCell>
      <TableCell>
        <Badge variant={isLowStock ? 'destructive' : 'secondary'}>
          {item.current_stock}
        </Badge>
      </TableCell>
      <TableCell>{item.base_unit?.abbreviation || 'units'}</TableCell>
      <TableCell>{item.minimum_threshold || 0}</TableCell>
      <TableCell>{item.maximum_threshold || 0}</TableCell>
      <TableCell>
        {item.unit_cost ? `$${item.unit_cost.toFixed(2)}` : 'N/A'}
      </TableCell>
    </TableRow>
  );
};