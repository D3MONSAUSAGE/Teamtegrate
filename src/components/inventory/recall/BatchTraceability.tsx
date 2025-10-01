import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Truck, Tag, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const BatchTraceability: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [batchData, setBatchData] = useState<any>(null);
  const [lotData, setLotData] = useState<any>(null);
  const [itemData, setItemData] = useState<any>(null);
  const [distributions, setDistributions] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);

  const searchBatch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a batch number');
      return;
    }

    setLoading(true);
    setBatchData(null);
    setLotData(null);
    setItemData(null);
    setDistributions([]);
    setLabels([]);

    try {
      // Find batch
      const { data: batch, error: batchError } = await supabase
        .from('manufacturing_batches')
        .select('*')
        .eq('batch_number', searchQuery.trim())
        .single();

      if (batchError || !batch) {
        throw new Error('Batch not found');
      }

      setBatchData(batch);

      // Get lot information
      if (batch.lot_id) {
        const { data: lot } = await supabase
          .from('inventory_lots')
          .select('*')
          .eq('id', batch.lot_id)
          .single();

        if (lot) {
          setLotData(lot);

          // Get item information
          if (lot.item_id) {
            const { data: item } = await supabase
              .from('inventory_items')
              .select('*')
              .eq('id', lot.item_id)
              .single();
            
            if (item) {
              setItemData(item);
            }
          }
        }
      }

      // Get distributions
      const { data: dists } = await supabase
        .from('product_distributions')
        .select('*')
        .eq('batch_id', batch.id);
      
      if (dists) setDistributions(dists);

      // Set labels from batch data instead
      setLabels([]);

      toast.success('Batch found!');
    } catch (error: any) {
      console.error('Traceability search failed:', error);
      toast.error(error.message || 'Failed to trace batch');
    } finally {
      setLoading(false);
    }
  };

  const hasData = batchData !== null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Batch Traceability</CardTitle>
          <CardDescription>
            Track complete supply chain from raw materials to distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter batch number (e.g., BATCH-2025-001)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchBatch()}
            />
            <Button onClick={searchBatch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasData && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Batch Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Batch Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Batch Number</p>
                <p className="font-semibold">{batchData.batch_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Manufacturing Date</p>
                <p className="font-medium">{batchData.manufacturing_date}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Manufactured</p>
                <p className="font-medium">{batchData.total_quantity_manufactured}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="font-medium">{batchData.quantity_remaining}</p>
              </div>
              {batchData.production_line && (
                <div>
                  <p className="text-sm text-muted-foreground">Production Line</p>
                  <Badge>{batchData.production_line}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Information */}
          {itemData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Product Name</p>
                  <p className="font-semibold">{itemData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="font-medium">{itemData.sku}</p>
                </div>
                {lotData && (
                  <div>
                    <p className="text-sm text-muted-foreground">Lot Number</p>
                    <p className="font-medium">{lotData.lot_number}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Distribution Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {distributions.length > 0 ? (
                <div className="space-y-2">
                  {distributions.map((dist) => (
                    <div key={dist.id} className="p-2 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{dist.distributor_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {dist.quantity_distributed}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {new Date(dist.distribution_date).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No distributions recorded</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Labels Generated */}
          <Card>
            <CardHeader>
              <CardTitle>Labels Generated</CardTitle>
            </CardHeader>
            <CardContent>
              {labels.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-2xl font-bold">{labels.length}</p>
                  <p className="text-sm text-muted-foreground">
                    Labels printed for this batch
                  </p>
                  <div className="text-sm">
                    <p>Labeled: {batchData.quantity_labeled}</p>
                    <p>Distributed: {batchData.quantity_distributed}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No labels generated yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
