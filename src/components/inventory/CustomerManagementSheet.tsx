import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Building, Phone, Mail, MapPin, Plus, ShoppingCart } from 'lucide-react';
import { useInvoiceClients } from '@/hooks/useInvoiceClients';
import { InvoiceClient } from '@/types/invoices';
import { ClientSelector } from '@/components/finance/invoices/ClientSelector';

interface CustomerManagementSheetProps {
  open: boolean;
  onClose: () => void;
  onSelectCustomerForSale?: (client: InvoiceClient) => void;
}

export const CustomerManagementSheet: React.FC<CustomerManagementSheetProps> = ({
  open,
  onClose,
  onSelectCustomerForSale
}) => {
  const { clients, isLoading } = useInvoiceClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [dummySelectedClient, setDummySelectedClient] = useState<InvoiceClient | null>(null);

  // Filter clients based on search term
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

  const handleSelectForSale = (client: InvoiceClient) => {
    if (onSelectCustomerForSale) {
      onSelectCustomerForSale(client);
      onClose();
    }
  };

  const handleClientCreated = (client: InvoiceClient) => {
    setShowCreateClient(false);
    setDummySelectedClient(null);
    if (onSelectCustomerForSale) {
      onSelectCustomerForSale(client);
      onClose();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Customer Management
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 h-full">
          {showCreateClient ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add New Customer</h3>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateClient(false)}
                >
                  Back to Customers
                </Button>
              </div>
              <ClientSelector
                selectedClient={dummySelectedClient}
                onClientSelect={handleClientCreated}
              />
            </div>
          ) : (
            <>
              {/* Header Actions */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  onClick={() => setShowCreateClient(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Customer
                </Button>
              </div>

              {/* Customer Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{clients.length}</div>
                    <div className="text-sm text-muted-foreground">Total Customers</div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{filteredClients.length}</div>
                    <div className="text-sm text-muted-foreground">
                      {searchTerm ? 'Search Results' : 'Active Customers'}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Customer List */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {searchTerm ? `Search Results (${filteredClients.length})` : 'All Customers'}
                  </h3>
                </div>

                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading customers...
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <Building className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <div className="font-medium">
                        {searchTerm ? 'No customers found' : 'No customers yet'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {searchTerm 
                          ? 'Try adjusting your search terms'
                          : 'Add your first customer to get started'
                        }
                      </div>
                    </div>
                    {!searchTerm && (
                      <Button 
                        onClick={() => setShowCreateClient(true)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add First Customer
                      </Button>
                    )}
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {filteredClients.map((client) => (
                        <Card key={client.id} className="p-4 hover:shadow-md transition-shadow">
                          <CardContent className="p-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Building className="h-4 w-4 text-muted-foreground" />
                                  <h4 className="font-medium truncate">{client.name}</h4>
                                  <Badge variant="secondary" className="ml-auto">
                                    Active
                                  </Badge>
                                </div>
                                
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  {client.email && (
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-3 w-3" />
                                      <span className="truncate">{client.email}</span>
                                    </div>
                                  )}
                                  {client.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-3 w-3" />
                                      <span>{client.phone}</span>
                                    </div>
                                  )}
                                  {(client.city || client.state) && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-3 w-3" />
                                      <span>
                                        {client.city}
                                        {client.city && client.state ? ', ' : ''}
                                        {client.state}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {onSelectCustomerForSale && (
                                <Button
                                  size="sm"
                                  onClick={() => handleSelectForSale(client)}
                                  className="flex items-center gap-2 ml-4"
                                >
                                  <ShoppingCart className="h-3 w-3" />
                                  Select for Sale
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};