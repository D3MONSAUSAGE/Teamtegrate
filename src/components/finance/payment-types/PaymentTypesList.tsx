import React from 'react';
import { PaymentType } from '@/types/invoices';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, DollarSign } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PaymentTypesListProps {
  paymentTypes: PaymentType[];
  isLoading: boolean;
  onUpdate: (id: string, data: Partial<PaymentType>) => void;
  onDelete: (id: string) => void;
}

export const PaymentTypesList: React.FC<PaymentTypesListProps> = ({
  paymentTypes,
  isLoading,
  onUpdate,
  onDelete,
}) => {
  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  if (paymentTypes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No payment types configured yet
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Cash Equivalent</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paymentTypes.map((type) => (
          <TableRow key={type.id}>
            <TableCell className="font-medium">{type.name}</TableCell>
            <TableCell className="text-muted-foreground">
              {type.description || '-'}
            </TableCell>
            <TableCell>
              {type.is_cash_equivalent ? (
                <Badge variant="default" className="gap-1">
                  <DollarSign className="h-3 w-3" />
                  Cash
                </Badge>
              ) : (
                <Badge variant="outline">Non-Cash</Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(type.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};