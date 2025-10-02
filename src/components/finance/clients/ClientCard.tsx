import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, MapPin, Building } from 'lucide-react';
import { InvoiceClient } from '@/types/invoices';

interface ClientCardProps {
  client: InvoiceClient;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{client.name}</CardTitle>
            {client.tax_id && (
              <p className="text-sm text-muted-foreground">Tax ID: {client.tax_id}</p>
            )}
          </div>
          <Badge variant={client.is_active ? "default" : "secondary"}>
            {client.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {client.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{client.email}</span>
          </div>
        )}
        
        {client.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{client.phone}</span>
          </div>
        )}
        
        {(client.address || client.city || client.state) && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5" />
            <div>
              {client.address && <div>{client.address}</div>}
              {(client.city || client.state || client.postal_code) && (
                <div>
                  {client.city}{client.state && `, ${client.state}`} {client.postal_code}
                </div>
              )}
              {client.country && <div>{client.country}</div>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
