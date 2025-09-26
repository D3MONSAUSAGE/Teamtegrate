import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InventoryItem } from '@/contexts/inventory/types';
import { formatCurrency } from '@/utils/formatters';
import { Trash2 } from 'lucide-react';

interface ItemTableRowProps {
  item: InventoryItem;
  onClick: (itemId: string) => void;
  onDelete?: (itemId: string) => void;
}

export const ItemTableRow: React.FC<ItemTableRowProps> = ({ item, onClick, onDelete }) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(item.id);
  };

  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50" 
      onClick={() => onClick(item.id)}
    >
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell>{item.sku || 'N/A'}</TableCell>
      <TableCell className="max-w-xs truncate">{item.description || 'N/A'}</TableCell>
      <TableCell>{item.category?.name || 'Uncategorized'}</TableCell>
      <TableCell className="text-center">
        <div className="font-medium">{item.conversion_factor || 1}</div>
        <div className="text-xs text-muted-foreground">
          {item.base_unit?.name || 'units'}
        </div>
      </TableCell>
      <TableCell className="text-center">
        {item.purchase_unit || 'Package'}
      </TableCell>
      <TableCell>
        {item.purchase_price ? formatCurrency(item.purchase_price) : 'N/A'}
      </TableCell>
      <TableCell>
        {item.vendor?.name || 'No Vendor'}
      </TableCell>
      {onDelete && (
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteClick}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
};