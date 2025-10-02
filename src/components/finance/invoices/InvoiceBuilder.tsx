import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClientSelector } from './ClientSelector';
import { InvoiceLineItems, LineItem } from './InvoiceLineItems';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { InvoiceClient } from '@/types/invoices';
import { useToast } from '@/hooks/use-toast';

interface InvoiceBuilderProps {
  onBack?: () => void;
  onInvoiceCreated?: () => void;
}

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ onBack, onInvoiceCreated }) => {
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<InvoiceClient | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [invoiceData, setInvoiceData] = useState({
    invoice_number: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    payment_terms: 'Net 30',
    notes: '',
    footer_text: 'Thank you for your business!'
  });
  const [taxRate, setTaxRate] = useState(0);

  const calculations = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total_price, 0);
    const tax_amount = subtotal * (taxRate / 100);
    const total = subtotal + tax_amount;

    return {
      subtotal,
      tax_amount,
      total
    };
  }, [lineItems, taxRate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleSaveDraft = async () => {
    if (!selectedClient || lineItems.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select a client and add at least one line item',
        variant: 'destructive'
      });
      return;
    }

    // TODO: Implement save to database
    toast({
      title: 'Draft Saved',
      description: 'Invoice has been saved as draft'
    });
    onInvoiceCreated?.();
  };

  const handleSendInvoice = async () => {
    if (!selectedClient || lineItems.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select a client and add at least one line item',
        variant: 'destructive'
      });
      return;
    }

    // TODO: Implement send invoice functionality
    toast({
      title: 'Invoice Sent',
      description: 'Invoice has been sent to client'
    });
    onInvoiceCreated?.();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold">Create Invoice</h2>
            <p className="text-muted-foreground">Build your professional invoice</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={handleSendInvoice}>
            <Send className="h-4 w-4 mr-2" />
            Send Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice_number">Invoice Number</Label>
                  <Input
                    id="invoice_number"
                    value={invoiceData.invoice_number}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, invoice_number: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment_terms">Payment Terms</Label>
                  <Select
                    value={invoiceData.payment_terms}
                    onValueChange={(value) => setInvoiceData(prev => ({ ...prev, payment_terms: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Due on receipt">Due on receipt</SelectItem>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="issue_date">Issue Date</Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={invoiceData.issue_date}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, issue_date: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={invoiceData.due_date}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientSelector
                selectedClient={selectedClient}
                onClientSelect={setSelectedClient}
              />
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items & Services</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceLineItems
                lineItems={lineItems}
                onLineItemsChange={setLineItems}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes for the client..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="footer_text">Footer Text</Label>
                <Textarea
                  id="footer_text"
                  value={invoiceData.footer_text}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, footer_text: e.target.value }))}
                  placeholder="Footer text that appears at the bottom of the invoice..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculations.subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Tax ({taxRate}%):</span>
                  <span>{formatCurrency(calculations.tax_amount)}</span>
                </div>
                
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(calculations.total)}</span>
                </div>
              </div>
              
              <div className="pt-4 text-sm text-muted-foreground">
                <p><strong>Items:</strong> {lineItems.length}</p>
                <p><strong>Client:</strong> {selectedClient?.name || 'Not selected'}</p>
                <p><strong>Due:</strong> {invoiceData.due_date}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};