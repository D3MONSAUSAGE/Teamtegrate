import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface ProductionEvent {
  id: string;
  transaction_type: string;
  item_id: string;
  quantity: number;
  transaction_date: string;
  notes?: string;
  inventory_items?: {
    name: string;
    sku: string;
  };
}

export const ProductionEventLog: React.FC = () => {
  const [events, setEvents] = useState<ProductionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProductionEvents();
  }, []);

  const loadProductionEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select(`
          id,
          transaction_type,
          item_id,
          quantity,
          transaction_date,
          notes,
          inventory_items!item_id(name, sku)
        `)
        .in('transaction_type', ['production_output', 'production_input', 'manufacturing'])
        .order('transaction_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Failed to load production events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'production_output':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'production_input':
        return <ArrowRight className="h-4 w-4 text-primary" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventBadge = (type: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      production_output: 'outline',
      production_input: 'default',
      manufacturing: 'secondary',
    };
    return variants[type] || 'default';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Production Events</CardTitle>
          <CardDescription>Loading production activity...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Production Events</CardTitle>
        <CardDescription>
          Recent production activities that can trigger batch creation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="mt-0.5">{getEventIcon(event.transaction_type)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      {event.inventory_items?.name || 'Unknown Item'}
                    </p>
                    <Badge variant={getEventBadge(event.transaction_type)}>
                      {event.transaction_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Qty: {event.quantity}</span>
                    <span>SKU: {event.inventory_items?.sku}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(event.transaction_date), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  {event.notes && (
                    <p className="text-sm text-muted-foreground">{event.notes}</p>
                  )}
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No production events found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
