import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Package, Plus, QrCode, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { inventoryLotsApi, InventoryLot } from '@/contexts/inventory/api/inventoryLots';
import { BarcodeGenerator } from '@/lib/barcode/barcodeGenerator';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface LotTrackingPanelProps {
  itemId: string;
  itemName: string;
}

export const LotTrackingPanel: React.FC<LotTrackingPanelProps> = ({ itemId, itemName }) => {
  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    lot_number: '',
    manufacturing_date: '',
    expiration_date: '',
    quantity_received: 0,
    cost_per_unit: 0,
    supplier_info: {},
    notes: ''
  });

  useEffect(() => {
    loadLots();
  }, [itemId]);

  const loadLots = async () => {
    try {
      setLoading(true);
      const lotsData = await inventoryLotsApi.getByItemId(itemId);
      setLots(lotsData);
    } catch (error) {
      console.error('Error loading lots:', error);
      toast.error('Failed to load lot information');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLot = async () => {
    try {
      if (!formData.lot_number || formData.quantity_received <= 0) {
        toast.error('Please provide lot number and quantity received');
        return;
      }

      const newLot = await inventoryLotsApi.create({
        organization_id: '', // Will be set by RLS
        item_id: itemId,
        lot_number: formData.lot_number,
        manufacturing_date: formData.manufacturing_date || null,
        expiration_date: formData.expiration_date || null,
        quantity_received: formData.quantity_received,
        quantity_remaining: formData.quantity_received,
        cost_per_unit: formData.cost_per_unit || null,
        supplier_info: formData.supplier_info,
        notes: formData.notes || null,
        is_active: true,
        created_by: '' // Will be set by auth
      });

      setLots([newLot, ...lots]);
      setIsAddDialogOpen(false);
      setFormData({
        lot_number: '',
        manufacturing_date: '',
        expiration_date: '',
        quantity_received: 0,
        cost_per_unit: 0,
        supplier_info: {},
        notes: ''
      });
      toast.success('Lot added successfully');
    } catch (error) {
      console.error('Error adding lot:', error);
      toast.error('Failed to add lot');
    }
  };

  const generateLotNumber = () => {
    const lotNumber = BarcodeGenerator.generateLotNumber('LOT');
    setFormData(prev => ({ ...prev, lot_number: lotNumber }));
  };

  const isExpiringSoon = (expirationDate: string | null) => {
    if (!expirationDate) return false;
    const expDate = parseISO(expirationDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expirationDate: string | null) => {
    if (!expirationDate) return false;
    const expDate = parseISO(expirationDate);
    return expDate < new Date();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lot Tracking - {itemName}
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Lot
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Lot</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lot-number">Lot Number *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="lot-number"
                      value={formData.lot_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, lot_number: e.target.value }))}
                      placeholder="Enter lot number"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={generateLotNumber}>
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mfg-date">Manufacturing Date</Label>
                    <Input
                      id="mfg-date"
                      type="date"
                      value={formData.manufacturing_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, manufacturing_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exp-date">Expiration Date</Label>
                    <Input
                      id="exp-date"
                      type="date"
                      value={formData.expiration_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiration_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity Received *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.quantity_received}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity_received: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost per Unit</Label>
                    <Input
                      id="cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cost_per_unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional notes about this lot"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddLot}>
                    Add Lot
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading lots...</div>
        ) : lots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No lots tracked for this item</p>
            <p className="text-sm">Add lot information to track expiration dates and inventory movement</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lot Number</TableHead>
                    <TableHead>Manufacturing</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots.map((lot) => (
                    <TableRow key={lot.id}>
                      <TableCell className="font-medium">{lot.lot_number}</TableCell>
                      <TableCell>
                        {lot.manufacturing_date ? format(parseISO(lot.manufacturing_date), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                        {lot.expiration_date ? (
                          <>
                            {format(parseISO(lot.expiration_date), 'MMM dd, yyyy')}
                            {isExpired(lot.expiration_date) && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Expired
                              </Badge>
                            )}
                            {!isExpired(lot.expiration_date) && isExpiringSoon(lot.expiration_date) && (
                              <Badge variant="secondary" className="text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                Expiring Soon
                              </Badge>
                            )}
                          </>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{lot.quantity_remaining} remaining</div>
                          <div className="text-muted-foreground text-xs">
                            of {lot.quantity_received} received
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lot.quantity_remaining > 0 ? (
                          <Badge variant="secondary">Available</Badge>
                        ) : (
                          <Badge variant="outline">Depleted</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};