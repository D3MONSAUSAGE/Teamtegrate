import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePaymentTypes } from '@/hooks/usePaymentTypes';
import { toast } from 'sonner';
import type { CreatedInvoice } from '@/types/invoices';

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: CreatedInvoice;
  onPaymentRecorded: () => void;
}

export const RecordPaymentDialog: React.FC<RecordPaymentDialogProps> = ({
  open,
  onOpenChange,
  invoice,
  onPaymentRecorded
}) => {
  const { user } = useAuth();
  const { paymentTypes } = usePaymentTypes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const remainingBalance = invoice.balance_due || invoice.total_amount;
  const [amount, setAmount] = useState(remainingBalance.toString());
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentTypeId, setPaymentTypeId] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const selectedPaymentType = paymentTypes.find(pt => pt.id === paymentTypeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.organizationId || !paymentTypeId) return;

    setIsSubmitting(true);
    try {
      const paymentAmount = parseFloat(amount);
      
      if (paymentAmount <= 0) {
        toast.error('Payment amount must be greater than 0');
        return;
      }

      if (paymentAmount > remainingBalance) {
        toast.error('Payment amount cannot exceed remaining balance');
        return;
      }

      const { error } = await supabase
        .from('payment_records')
        .insert({
          organization_id: user.organizationId,
          invoice_id: invoice.id,
          amount: paymentAmount,
          payment_method: 'other', // Legacy field
          payment_type_id: paymentTypeId,
          is_cash_payment: selectedPaymentType?.is_cash_equivalent || false,
          payment_date: format(paymentDate, 'yyyy-MM-dd'),
          reference_number: referenceNumber || null,
          notes: notes || null,
          recorded_by: user.id
        });

      if (error) throw error;

      toast.success('Payment recorded successfully');
      onPaymentRecorded();
      onOpenChange(false);
      
      // Reset form
      setAmount(remainingBalance.toString());
      setPaymentDate(new Date());
      setPaymentTypeId('');
      setReferenceNumber('');
      setNotes('');
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Invoice #{invoice.invoice_number} - Balance: ${remainingBalance.toFixed(2)}
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !paymentDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDate ? format(paymentDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={(date) => date && setPaymentDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentType">Payment Method *</Label>
            <Select value={paymentTypeId} onValueChange={setPaymentTypeId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                    {type.is_cash_equivalent && ' (Cash)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference Number</Label>
            <Input
              id="reference"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Check #, Transaction ID, etc."
            />
            <p className="text-xs text-muted-foreground">
              For checks, enter check number. For transfers, enter transaction ID.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !paymentTypeId}>
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
