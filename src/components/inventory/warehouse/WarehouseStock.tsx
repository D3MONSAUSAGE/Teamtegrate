import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Search, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';

export const WarehouseStock: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Warehouse Stock
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search items..." 
                className="pl-10 w-full sm:w-64"
                disabled
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Warehouse Not Configured</h3>
          <p className="text-muted-foreground max-w-md mb-4">
            Warehouse functionality is not yet set up. The warehouse stock table and 
            related features will be available once the warehouse system is configured.
          </p>
          <Badge variant="outline">
            Coming Soon
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};