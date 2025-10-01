import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { InventoryItem } from '@/contexts/inventory/types';
import { formatCurrency } from '@/utils/formatters';
import { Trash2, MoreHorizontal, Globe, Users } from 'lucide-react';

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
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <span>{item.name}</span>
          {!item.team_id ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Global
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Team-Specific
            </Badge>
          )}
        </div>
      </TableCell>
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
        <div className="space-y-1">
          <div className="font-medium">
            {item.sale_price ? formatCurrency(item.sale_price) : 'N/A'}
          </div>
          {item.sale_price && item.unit_cost && (
            <div className="text-xs text-muted-foreground">
              Profit: {formatCurrency(item.sale_price - item.unit_cost)}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {item.vendor?.name || 'No Vendor'}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onDelete && (
              <DropdownMenuItem 
                onClick={handleDeleteClick}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};