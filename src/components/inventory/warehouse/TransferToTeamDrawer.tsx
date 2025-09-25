import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Minus, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useInvoiceTeams } from '@/hooks/useInvoiceTeams';

interface TransferLineItem {
  id: string;
  item: string;
  quantity: number;
  unitPrice: number;
}

export const TransferToTeamDrawer: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [lineItems, setLineItems] = useState<TransferLineItem[]>([
    { id: '1', item: '', quantity: 0, unitPrice: 0 }
  ]);

  const { teams, isLoading: teamsLoading } = useInvoiceTeams();

  const addLineItem = () => {
    const newItem: TransferLineItem = {
      id: Date.now().toString(),
      item: '',
      quantity: 0,
      unitPrice: 0
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof TransferLineItem, value: string | number) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = () => {
    if (!selectedTeam) {
      toast.error('Please select a team');
      return;
    }

    const validItems = lineItems.filter(item => item.item.trim() && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one valid item');
      return;
    }

    // Simulate API call - graceful handling for missing backend
    toast.info('Warehouse transfer system is not configured yet');
    
    // Reset form
    setSelectedTeam('');
    setTransferNotes('');
    setLineItems([{ id: '1', item: '', quantity: 0, unitPrice: 0 }]);
    setOpen(false);
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Send className="h-4 w-4" />
          Transfer to Team
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Transfer to Team
            </DrawerTitle>
            <DrawerDescription>
              Send inventory from warehouse to a team
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamsLoading ? (
                      <SelectItem value="loading" disabled>Loading teams...</SelectItem>
                    ) : teams.length > 0 ? (
                      teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-teams" disabled>No teams available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Transfer Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Transfer notes or reference"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button onClick={addLineItem} size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {lineItems.map((item, index) => (
                  <Card key={item.id}>
                    <CardContent className="p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-5">
                          <Input
                            placeholder="Item name"
                            value={item.item}
                            onChange={(e) => updateLineItem(item.id, 'item', e.target.value)}
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <Input
                            type="number"
                            placeholder="Quantity"
                            value={item.quantity || ''}
                            onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Unit Price"
                            value={item.unitPrice || ''}
                            onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="sm:col-span-1 flex justify-center">
                          <Button
                            onClick={() => removeLineItem(item.id)}
                            size="sm"
                            variant="ghost"
                            disabled={lineItems.length === 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalAmount > 0 && (
                <div className="flex justify-end pt-2 border-t">
                  <div className="text-sm font-medium">
                    Total: ${totalAmount.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DrawerFooter>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleSubmit} className="flex-1">
                Send Transfer
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};