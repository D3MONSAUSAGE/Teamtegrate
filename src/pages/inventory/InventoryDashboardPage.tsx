import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useInventory } from '@/contexts/inventory';
import { InventoryProvider } from '@/contexts/inventory';
import { InventoryBreadcrumb } from '@/components/inventory/navigation/InventoryBreadcrumb';
import { 
  Package, 
  FileText, 
  Warehouse, 
  Settings, 
  Play, 
  AlertTriangle
} from 'lucide-react';

const InventoryDashboardContent: React.FC = () => {
  const { hasRoleAccess } = useAuth();
  const { items, counts, loading } = useInventory();

  // Calculate quick stats
  const activeCount = counts.find(c => c.status === 'in_progress');
  const todayCounts = counts.filter(count => {
    const today = new Date();
    const countDate = new Date(count.created_at);
    return countDate.toDateString() === today.toDateString();
  }).length;

  const lowStockItems = items.filter(item => 
    item.current_stock < (item.minimum_threshold || 0)
  ).length;

  const quickAccessItems = [
    {
      title: 'Inventory Count',
      description: 'Conduct physical inventory counts',
      href: '/dashboard/inventory/count',
      icon: Package,
      badge: activeCount ? 'In Progress' : null,
      badgeVariant: 'secondary' as const,
    },
    {
      title: 'Records & Analytics',
      description: 'View transaction history and reports',
      href: '/dashboard/inventory/records',
      icon: FileText,
      badge: null,
      requiresRole: 'manager' as const,
    },
    {
      title: 'Warehouse Management',
      description: 'Manage warehouse stock and operations',
      href: '/dashboard/inventory/warehouse',
      icon: Warehouse,
      badge: null,
      requiresRole: 'manager' as const,
    },
    {
      title: 'Inventory Management',
      description: 'Manage items, categories, and vendors',
      href: '/dashboard/inventory/management',
      icon: Settings,
      badge: null,
      requiresRole: 'manager' as const,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <InventoryBreadcrumb currentPage="Overview" />
      
      <div className="flex items-center space-x-2 mb-6">
        <Package className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            Comprehensive inventory management dashboard
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{loading ? '...' : items.length}</p>
              </div>
              <Package className="h-8 w-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Counts</p>
                <p className="text-2xl font-bold">{todayCounts}</p>
              </div>
              <Play className="h-8 w-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-destructive">{lowStockItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {quickAccessItems.map((item) => {
          // Filter items based on role access
          if (item.requiresRole && !hasRoleAccess(item.requiresRole)) {
            return null;
          }
          
          return (
            <Card key={item.href} className="group hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
                {item.badge && (
                  <Badge variant={item.badgeVariant}>{item.badge}</Badge>
                )}
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to={item.href}>
                    Go to {item.title}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  );
};

const InventoryDashboardPage: React.FC = () => {
  return (
    <InventoryProvider>
      <InventoryDashboardContent />
    </InventoryProvider>
  );
};

export default InventoryDashboardPage;