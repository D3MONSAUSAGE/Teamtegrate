import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInventory } from '@/contexts/inventory';
import { AlertTriangle } from 'lucide-react';

export const InventoryAlertsPanel: React.FC = () => {
  const { alerts } = useInventory();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Active Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div key={alert.id} className="p-3 border rounded-lg">
              <p className="font-medium">{alert.alert_type.replace('_', ' ').toUpperCase()}</p>
              <p className="text-sm text-muted-foreground">
                Alert created on {new Date(alert.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};