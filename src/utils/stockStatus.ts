export type StockStatus = 'under_stock' | 'over_stock' | 'normal_stock' | 'no_thresholds';

export interface StockStatusInfo {
  status: StockStatus;
  isLowStock: boolean;
  isOverStock: boolean;
  isNormalStock: boolean;
  message: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export function getStockStatus(
  actualQuantity: number,
  minimumThreshold?: number | null,
  maximumThreshold?: number | null
): StockStatusInfo {
  // If no thresholds are set, we can't determine stock status
  if (!minimumThreshold && !maximumThreshold) {
    return {
      status: 'no_thresholds',
      isLowStock: false,
      isOverStock: false,
      isNormalStock: false,
      message: 'No thresholds set',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
      borderColor: 'border-muted',
    };
  }

  const isLowStock = minimumThreshold && actualQuantity < minimumThreshold;
  const isOverStock = maximumThreshold && actualQuantity > maximumThreshold;

  if (isLowStock) {
    return {
      status: 'under_stock',
      isLowStock: true,
      isOverStock: false,
      isNormalStock: false,
      message: 'Under Stock',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/20',
    };
  }

  if (isOverStock) {
    return {
      status: 'over_stock',
      isLowStock: false,
      isOverStock: true,
      isNormalStock: false,
      message: 'Over Stock',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    };
  }

  return {
    status: 'normal_stock',
    isLowStock: false,
    isOverStock: false,
    isNormalStock: true,
    message: 'Normal Stock',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  };
}

export function getStockStatusSummary(items: Array<{
  actualQuantity: number;
  minimumThreshold?: number | null;
  maximumThreshold?: number | null;
}>) {
  let underStock = 0;
  let overStock = 0;
  let normalStock = 0;
  let noThresholds = 0;

  items.forEach(item => {
    const status = getStockStatus(item.actualQuantity, item.minimumThreshold, item.maximumThreshold);
    switch (status.status) {
      case 'under_stock':
        underStock++;
        break;
      case 'over_stock':
        overStock++;
        break;
      case 'normal_stock':
        normalStock++;
        break;
      case 'no_thresholds':
        noThresholds++;
        break;
    }
  });

  return {
    underStock,
    overStock,
    normalStock,
    noThresholds,
    total: items.length,
  };
}