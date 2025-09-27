import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpDown,
  Building2,
  MoreHorizontal
} from 'lucide-react';
import { warehouseApi, type WarehouseOverview, type DailyMetrics } from '@/contexts/warehouse/api/warehouseApi';
import { toast } from 'sonner';

interface WarehouseOverviewDashboardProps {
  onSelectWarehouse?: (teamId: string | null) => void;
}

export const WarehouseOverviewDashboard: React.FC<WarehouseOverviewDashboardProps> = ({
  onSelectWarehouse
}) => {
  const [warehouses, setWarehouses] = useState<WarehouseOverview[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [warehouseData, metricsData] = await Promise.all([
        warehouseApi.getWarehouseOverview(),
        warehouseApi.getDailyMetrics()
      ]);
      
      setWarehouses(warehouseData);
      setDailyMetrics(metricsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load warehouse overview');
    } finally {
      setLoading(false);
    }
  };

  const getTotalInventoryValue = () => {
    return warehouses.reduce((sum, warehouse) => sum + warehouse.total_inventory_value, 0);
  };

  const getTotalItems = () => {
    return warehouses.reduce((sum, warehouse) => sum + warehouse.total_items, 0);
  };

  const getTotalLowStockAlerts = () => {
    return warehouses.reduce((sum, warehouse) => sum + warehouse.low_stock_count, 0);
  };

  const getStockStatusBadge = (lowStockCount: number) => {
    if (lowStockCount === 0) {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Normal</Badge>;
    } else if (lowStockCount <= 5) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Low Stock</Badge>;
    } else {
      return <Badge variant="destructive">Critical</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Warehouses</p>
                <p className="text-2xl font-bold">{warehouses.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                <p className="text-2xl font-bold">${getTotalInventoryValue().toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{getTotalItems().toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
                <p className="text-2xl font-bold">{getTotalLowStockAlerts()}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Activity */}
      {dailyMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{dailyMetrics.receipts_count}</p>
                <p className="text-sm text-muted-foreground">Items Received</p>
                <p className="text-xs text-muted-foreground">${dailyMetrics.receipts_value.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{dailyMetrics.transfers_count}</p>
                <p className="text-sm text-muted-foreground">Transfers Sent</p>
                <p className="text-xs text-muted-foreground">${dailyMetrics.transfers_value.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{getTotalLowStockAlerts()}</p>
                <p className="text-sm text-muted-foreground">Stock Alerts</p>
                <p className="text-xs text-muted-foreground">Need Attention</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{warehouses.length}</p>
                <p className="text-sm text-muted-foreground">Active Warehouses</p>
                <p className="text-xs text-muted-foreground">Currently Operating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warehouse Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map((warehouse) => (
          <Card key={warehouse.warehouse_id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{warehouse.warehouse_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{warehouse.team_name}</p>
                  {warehouse.address && (
                    <p className="text-xs text-muted-foreground mt-1">{warehouse.address}</p>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Inventory Value</p>
                  <p className="font-semibold">${warehouse.total_inventory_value.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="font-semibold">{warehouse.total_items}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Stock Status:</p>
                  {getStockStatusBadge(warehouse.low_stock_count)}
                </div>
                {warehouse.low_stock_count > 0 && (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs">{warehouse.low_stock_count} alerts</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => onSelectWarehouse?.(warehouse.team_id)}
                >
                  View Details
                </Button>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {warehouses.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Warehouses Found</h3>
              <p className="text-muted-foreground">
                Set up your first warehouse to start managing inventory.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};