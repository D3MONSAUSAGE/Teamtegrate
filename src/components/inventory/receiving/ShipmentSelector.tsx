import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Package, Truck } from 'lucide-react';
import { shipmentsApi, Shipment } from '@/contexts/inventory/api/shipments';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ShipmentSelectorProps {
  selectedShipmentId?: string;
  onShipmentSelect: (shipment: Shipment | null) => void;
  className?: string;
}

export const ShipmentSelector: React.FC<ShipmentSelectorProps> = ({
  selectedShipmentId,
  onShipmentSelect,
  className = '',
}) => {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newShipment, setNewShipment] = useState({
    supplier_name: '',
    reference_number: '',
    notes: '',
  });

  useEffect(() => {
    loadRecentShipments();
  }, []);

  const loadRecentShipments = async () => {
    try {
      const data = await shipmentsApi.getRecentShipments(20);
      setShipments(data);
    } catch (error) {
      console.error('Failed to load shipments:', error);
    }
  };

  const createNewShipment = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const shipment = await shipmentsApi.create({
        organization_id: '', // Will be set by RLS
        received_date: new Date().toISOString().split('T')[0],
        supplier_info: { name: newShipment.supplier_name },
        reference_number: newShipment.reference_number,
        notes: newShipment.notes,
        created_by: user.id,
      });

      setShipments(prev => [shipment, ...prev]);
      onShipmentSelect(shipment);
      setDialogOpen(false);
      setNewShipment({ supplier_name: '', reference_number: '', notes: '' });
      toast.success('Shipment created successfully');
    } catch (error) {
      console.error('Failed to create shipment:', error);
      toast.error('Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  const handleShipmentSelect = (shipmentId: string) => {
    const shipment = shipments.find(s => s.id === shipmentId);
    onShipmentSelect(shipment || null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Truck className="h-5 w-5 text-muted-foreground" />
        <Label className="text-sm font-medium">Shipment</Label>
      </div>
      
      <div className="flex gap-2">
        <Select
          value={selectedShipmentId || ''}
          onValueChange={handleShipmentSelect}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select existing shipment..." />
          </SelectTrigger>
          <SelectContent>
            {shipments.map((shipment) => (
              <SelectItem key={shipment.id} value={shipment.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{shipment.shipment_number}</span>
                  <span className="text-xs text-muted-foreground">
                    {shipment.supplier_info?.name || 'Unknown Supplier'} • {new Date(shipment.received_date).toLocaleDateString()}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Create New Shipment
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="supplier">Supplier Name</Label>
                <Input
                  id="supplier"
                  value={newShipment.supplier_name}
                  onChange={(e) => setNewShipment(prev => ({ ...prev, supplier_name: e.target.value }))}
                  placeholder="Enter supplier name"
                />
              </div>
              <div>
                <Label htmlFor="reference">Reference Number</Label>
                <Input
                  id="reference"
                  value={newShipment.reference_number}
                  onChange={(e) => setNewShipment(prev => ({ ...prev, reference_number: e.target.value }))}
                  placeholder="PO number, invoice, etc."
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newShipment.notes}
                  onChange={(e) => setNewShipment(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this shipment"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={createNewShipment}
                  disabled={loading || !newShipment.supplier_name}
                >
                  {loading ? 'Creating...' : 'Create Shipment'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedShipmentId && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onShipmentSelect(null)}
          className="text-xs"
        >
          Clear Selection
        </Button>
      )}
    </div>
  );
};