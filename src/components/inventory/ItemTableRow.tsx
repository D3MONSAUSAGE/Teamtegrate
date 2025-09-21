import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { InventoryItem } from '@/contexts/inventory/types';

interface ItemTableRowProps {
  item: InventoryItem;
  onClick: (itemId: string) => void;
}

export const ItemTableRow: React.FC<ItemTableRowProps> = ({ item, onClick }) => {
  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50" 
      onClick={() => onClick(item.id)}
    >
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell>{item.sku || 'N/A'}</TableCell>
      <TableCell className="max-w-xs truncate">{item.description || 'N/A'}</TableCell>
      <TableCell>{item.category?.name || 'Uncategorized'}</TableCell>
      <TableCell>{item.base_unit?.name || 'N/A'}</TableCell>
      <TableCell>{item.location || 'N/A'}</TableCell>
      <TableCell>
        {item.purchase_unit && item.conversion_factor && item.base_unit?.measurement_type
          ? `${item.conversion_factor} ${item.base_unit.measurement_type} per ${item.purchase_unit}`
          : item.purchase_unit || 'Individual'
        }
      </TableCell>
      <TableCell>
        {item.unit_cost ? `$${item.unit_cost.toFixed(4)}` : 'N/A'}
      </TableCell>
    </TableRow>
  );
};