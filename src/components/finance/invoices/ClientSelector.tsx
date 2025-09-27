import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Building } from 'lucide-react';
import { useInvoiceClients } from '@/hooks/useInvoiceClients';
import { InvoiceClient } from '@/types/invoices';
import { useToast } from '@/hooks/use-toast';

interface ClientSelectorProps {
  selectedClient: InvoiceClient | null;
  onClientSelect: (client: InvoiceClient | null) => void;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  selectedClient,
  onClientSelect
}) => {
  const { clients, isLoading, createClient } = useInvoiceClients();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    tax_id: ''
  });

  const handleCreateClient = async () => {
    if (!newClientData.name) {
      toast({
        title: 'Error',
        description: 'Client name is required',
        variant: 'destructive'
      });
      return;
    }

    setIsCreating(true);
    try {
      const client = await createClient({
        ...newClientData,
        is_active: true
      });
      
      onClientSelect(client);
      toast({
        title: 'Success',
        description: 'Client created successfully'
      });
      setIsDialogOpen(false);
      setNewClientData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'US',
        tax_id: ''
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create client',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="client">Bill To</Label>
      <div className="flex gap-2">
        <Select
          value={selectedClient?.id || ''}
          onValueChange={(value) => {
            const client = clients.find(c => c.id === value) || null;
            onClientSelect(client);
          }}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={isLoading ? "Loading clients..." : "Select a client"} />
          </SelectTrigger>
          <SelectContent>
            {clients.map(client => (
              <SelectItem key={client.id} value={client.id}>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{client.name}</div>
                    {client.email && (
                      <div className="text-sm text-muted-foreground">{client.email}</div>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Create a new client for invoicing
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={newClientData.name}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Acme Corporation"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="billing@acme.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newClientData.phone}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tax_id">Tax ID</Label>
                <Input
                  id="tax_id"
                  value={newClientData.tax_id}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, tax_id: e.target.value }))}
                  placeholder="12-3456789"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={newClientData.address}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Business St"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={newClientData.city}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="New York"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={newClientData.state}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="NY"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={newClientData.postal_code}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, postal_code: e.target.value }))}
                  placeholder="10001"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={newClientData.country}
                  onValueChange={(value) => setNewClientData(prev => ({ ...prev, country: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateClient} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Client'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {selectedClient && (
        <div className="p-3 bg-muted rounded-md text-sm">
          <div className="font-medium">{selectedClient.name}</div>
          {selectedClient.email && <div>{selectedClient.email}</div>}
          {selectedClient.address && (
            <div className="mt-1">
              <div>{selectedClient.address}</div>
              {(selectedClient.city || selectedClient.state || selectedClient.postal_code) && (
                <div>
                  {selectedClient.city}{selectedClient.city && selectedClient.state ? ', ' : ''}{selectedClient.state} {selectedClient.postal_code}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};