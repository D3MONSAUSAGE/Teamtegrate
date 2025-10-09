import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  DollarSign, 
  Warehouse, 
  Hash, 
  Barcode, 
  MapPin, 
  Building2,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Phone,
  Mail,
  Globe,
  TrendingUp
} from 'lucide-react';
import { InventoryItem } from '@/contexts/inventory/types';
import { formatCurrency, formatNumber } from '@/utils/formatters';

interface ItemDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  open,
  onOpenChange,
  item,
  onEdit,
  onDelete
}) => {
  if (!item) return null;

  const isLowStock = item.current_stock < (item.minimum_threshold || 0);
  const isOverstock = item.maximum_threshold && item.current_stock > item.maximum_threshold;

  const stockStatus = isLowStock ? 'low' : isOverstock ? 'high' : 'normal';
  const stockStatusColor = stockStatus === 'low' ? 'destructive' : stockStatus === 'high' ? 'secondary' : 'default';
  const stockStatusIcon = stockStatus === 'low' ? AlertTriangle : CheckCircle;
  const StockIcon = stockStatusIcon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{item.name}</DialogTitle>
              {item.description && (
                <p className="text-muted-foreground mt-1">{item.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(item)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(item)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Image */}
          {item.image_url && (
            <div className="relative w-full h-64 rounded-lg overflow-hidden border bg-muted">
              <img 
                src={item.image_url} 
                alt={item.name}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stockStatus === 'low' ? 'bg-destructive/10' : stockStatus === 'high' ? 'bg-secondary/10' : 'bg-primary/10'}`}>
                    <StockIcon className={`h-5 w-5 ${stockStatus === 'low' ? 'text-destructive' : stockStatus === 'high' ? 'text-secondary-foreground' : 'text-primary'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Stock</p>
                    <p className="text-xl font-bold">
                      {formatNumber(item.current_stock)} {item.base_unit?.abbreviation || 'units'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <DollarSign className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unit Cost</p>
                    <p className="text-xl font-bold">
                      {item.unit_cost ? formatCurrency(item.unit_cost) : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Package className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Package Price</p>
                    <p className="text-xl font-bold">
                      {item.purchase_price ? formatCurrency(item.purchase_price) : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <DollarSign className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sale Price</p>
                    <p className="text-xl font-bold">
                      {item.sale_price ? formatCurrency(item.sale_price) : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profit Analysis */}
          {item.unit_cost && item.sale_price && (
            <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <TrendingUp className="h-5 w-5" />
                  Profit Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Profit per Unit</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.sale_price - item.unit_cost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {((item.sale_price - item.unit_cost) / item.sale_price * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p className="font-medium">{item.category?.name || 'Uncategorized'}</p>
                </div>
                {item.vendor && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Vendor</p>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">{item.vendor.name}</span>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Base Unit</p>
                  <p className="font-medium">{item.base_unit?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Purchase Unit</p>
                  <p className="font-medium">{item.purchase_unit || 'N/A'}</p>
                </div>
                {item.conversion_factor && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Conversion Factor</p>
                    <p className="font-medium">{item.conversion_factor}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vendor Information */}
          {item.vendor && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Vendor Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Vendor Name</p>
                    <p className="font-medium">{item.vendor.name}</p>
                  </div>
                  {item.vendor.contact_email && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <a 
                          href={`mailto:${item.vendor.contact_email}`} 
                          className="text-primary hover:underline"
                        >
                          {item.vendor.contact_email}
                        </a>
                      </div>
                    </div>
                  )}
                  {item.vendor.contact_phone && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <a 
                          href={`tel:${item.vendor.contact_phone}`} 
                          className="text-primary hover:underline"
                        >
                          {item.vendor.contact_phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {item.vendor.website && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Website</p>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <a 
                          href={item.vendor.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {item.vendor.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                {item.vendor.address && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="font-medium whitespace-pre-line">{item.vendor.address}</p>
                  </div>
                )}
                {item.vendor.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{item.vendor.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stock Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5" />
                Stock Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Stock</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={stockStatusColor}>
                      {formatNumber(item.current_stock)} {item.base_unit?.abbreviation || 'units'}
                    </Badge>
                    <StockIcon className={`h-4 w-4 ${stockStatus === 'low' ? 'text-destructive' : stockStatus === 'high' ? 'text-secondary-foreground' : 'text-primary'}`} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Minimum Threshold</p>
                  <p className="font-medium mt-1">
                    {item.minimum_threshold ? formatNumber(item.minimum_threshold) : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Maximum Threshold</p>
                  <p className="font-medium mt-1">
                    {item.maximum_threshold ? formatNumber(item.maximum_threshold) : 'Not set'}
                  </p>
                </div>
                {item.reorder_point && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reorder Point</p>
                    <p className="font-medium mt-1">{formatNumber(item.reorder_point)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Identification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Identification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">SKU</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Hash className="h-4 w-4" />
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {item.sku || 'Not set'}
                    </code>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Barcode</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Barcode className="h-4 w-4" />
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {item.barcode || 'Not set'}
                    </code>
                  </div>
                </div>
                {item.location && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">{item.location}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};