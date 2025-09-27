import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, Mail, Phone, MapPin } from 'lucide-react';
import { FinanceBreadcrumb } from '@/components/finance/navigation/FinanceBreadcrumb';

export default function ClientsPage() {
  const [clients] = useState([
    {
      id: 1,
      name: 'Acme Corporation',
      email: 'billing@acme.com',
      phone: '+1 (555) 123-4567',
      address: '123 Business St, City, State 12345',
      totalInvoiced: 15420.00,
      status: 'Active'
    },
    // Placeholder data
  ]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <FinanceBreadcrumb 
        items={[
          { label: 'Finance', href: '/dashboard/finance' },
          { label: 'Clients', href: '/dashboard/finance/clients' }
        ]} 
      />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Management</h1>
          <p className="text-muted-foreground">
            Manage your client information and billing details
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Clients Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by adding your first client to create and send invoices
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{client.name}</span>
                  <span className="text-sm font-normal text-green-600 bg-green-50 px-2 py-1 rounded">
                    {client.status}
                  </span>
                </CardTitle>
                <CardDescription>
                  Total Invoiced: ${client.totalInvoiced.toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {client.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {client.phone}
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  {client.address}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}