import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getStockStatus, type StockStatus } from '@/utils/stockStatus';
import { cn } from '@/lib/utils';

interface StockStatusBadgeProps {
  actualQuantity: number;
  minimumThreshold?: number | null;
  maximumThreshold?: number | null;
  templateMinimum?: number | null;
  templateMaximum?: number | null;
  size?: 'sm' | 'default';
}

export const StockStatusBadge: React.FC<StockStatusBadgeProps> = ({
  actualQuantity,
  minimumThreshold,
  maximumThreshold,
  templateMinimum,
  templateMaximum,
  size = 'default'
}) => {
  const stockInfo = getStockStatus(actualQuantity, minimumThreshold, maximumThreshold, templateMinimum, templateMaximum);

  const getVariant = (status: StockStatus) => {
    switch (status) {
      case 'under_stock':
        return 'destructive';
      case 'over_stock':
        return 'secondary';
      case 'normal_stock':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <Badge 
      variant={getVariant(stockInfo.status)}
      className={cn(
        'font-medium',
        size === 'sm' && 'text-xs px-2 py-0.5',
        stockInfo.status === 'over_stock' && 'bg-orange-100 text-orange-700 border-orange-300',
        stockInfo.status === 'normal_stock' && 'bg-green-100 text-green-700 border-green-300'
      )}
    >
      {stockInfo.message}
    </Badge>
  );
};