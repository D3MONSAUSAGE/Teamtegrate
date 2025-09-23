import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InventoryItem } from '@/contexts/inventory/types';
import { formatCurrency } from '@/utils/formatters';
import { Edit2, Trash2 } from 'lucide-react';

interface ItemTableRowProps {
  item: InventoryItem;
  onEdit: (itemId: string) => void;
  onDelete: (itemId: string) => void;
}

export const ItemTableRow: React.FC<ItemTableRowProps> = ({ item, onEdit, onDelete }) => {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(item.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item.id);
  };

  return (
    <TableRow className="hover:bg-muted/50">
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
        {item.unit_cost ? formatCurrency(item.unit_cost) : 'N/A'}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};