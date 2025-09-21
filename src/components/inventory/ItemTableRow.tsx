import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { InventoryItem } from '@/contexts/inventory/types';
import { formatCurrency } from '@/utils/formatters';

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
      <TableCell>
        {item.base_unit?.name || item.purchase_unit || 'Individual'}
      </TableCell>
      <TableCell>
        {item.purchase_price ? formatCurrency(item.purchase_price) : 'N/A'}
      </TableCell>
      <TableCell>
        {item.unit_cost ? formatCurrency(item.unit_cost) : 'N/A'}
      </TableCell>
    </TableRow>
  );
};