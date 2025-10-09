import React from 'react';
import { Card, CardContent } from '@/components/ui/enhanced-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Eye, Edit2, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';

export interface ProductCardItem {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  category?: { name: string; };
  base_unit?: { name: string; abbreviation: string; };
  image_url?: string;
  // Warehouse-specific fields
  on_hand?: number;
  reorder_min?: number;
  reorder_max?: number;
  sale_price?: number;
  // Master items-specific fields
  vendor?: { name: string; };
  purchase_unit?: string;
  purchase_price?: number;
  conversion_factor?: number;
  unit_cost?: number;
}

interface ProductCardProps {
  item: ProductCardItem;
  variant?: 'warehouse' | 'master';
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  variant = 'warehouse',
  onView,
  onEdit,
  onDelete,
  showActions = true
}) => {
  // Determine stock status for warehouse variant
  const getStockStatus = () => {
    if (variant !== 'warehouse' || item.on_hand === undefined) return null;
    
    if (item.reorder_min && item.on_hand <= item.reorder_min) {
      return { label: 'Low Stock', variant: 'destructive' as const, icon: AlertTriangle };
    }
    if (item.reorder_max && item.on_hand >= item.reorder_max) {
      return { label: 'Overstock', variant: 'secondary' as const, icon: AlertTriangle };
    }
    return { label: 'Normal', variant: 'default' as const, icon: CheckCircle2 };
  };

  const stockStatus = getStockStatus();

  return (
    <Card 
      variant="interactive" 
      hover="lift"
      className="group h-full"
    >
      <CardContent className="p-0">
        {/* Image Section */}
        <div className="relative h-48 bg-gradient-to-br from-muted/50 to-muted overflow-hidden">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-16 w-16 text-muted-foreground/40" />
            </div>
          )}
          
          {/* Category Badge */}
          {item.category && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="backdrop-blur-sm bg-background/80">
                {item.category.name}
              </Badge>
            </div>
          )}
          
          {/* Stock Status Badge for Warehouse */}
          {stockStatus && (
            <div className="absolute top-2 right-2">
              <Badge variant={stockStatus.variant} className="backdrop-blur-sm gap-1">
                <stockStatus.icon className="h-3 w-3" />
                {stockStatus.label}
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Product Name & SKU */}
          <div>
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {item.name}
            </h3>
            {item.sku && (
              <p className="text-sm text-muted-foreground">
                SKU: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{item.sku}</code>
              </p>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            {variant === 'warehouse' ? (
              <>
                {/* Warehouse View: Stock & Price - Always show all 4 fields for uniform height */}
                <div>
                  <p className="text-xs text-muted-foreground">In Stock</p>
                  <p className="font-semibold">
                    {formatNumber(item.on_hand || 0)}
                    {item.base_unit && (
                      <span className="text-xs text-muted-foreground ml-1">
                        {item.base_unit.abbreviation}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="font-semibold text-primary">
                    {item.sale_price !== undefined ? formatCurrency(item.sale_price) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Min Stock</p>
                  <p className="font-medium text-sm">
                    {item.reorder_min != null ? formatNumber(item.reorder_min) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Max Stock</p>
                  <p className="font-medium text-sm">
                    {item.reorder_max != null ? formatNumber(item.reorder_max) : '—'}
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Master Items View: Vendor & Purchase Info */}
                {item.vendor && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Vendor</p>
                    <p className="font-medium text-sm">{item.vendor.name}</p>
                  </div>
                )}
                {item.purchase_unit && (
                  <div>
                    <p className="text-xs text-muted-foreground">Package</p>
                    <p className="font-medium text-sm">{item.purchase_unit}</p>
                  </div>
                )}
                {item.conversion_factor && (
                  <div>
                    <p className="text-xs text-muted-foreground">Units/Pkg</p>
                    <p className="font-medium text-sm">{formatNumber(item.conversion_factor)}</p>
                  </div>
                )}
                {item.purchase_price !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">Pkg Price</p>
                    <p className="font-semibold text-primary text-sm">
                      {formatCurrency(item.purchase_price)}
                    </p>
                  </div>
                )}
                {item.unit_cost !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">Unit Price</p>
                    <p className="font-medium text-sm">{formatCurrency(item.unit_cost)}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2 pt-2 border-t">
              {onView && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onView(item.id)}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  View
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onEdit(item.id)}
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(item.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};