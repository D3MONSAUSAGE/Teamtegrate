import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ClientSelector } from './ClientSelector';
import { InvoiceLineItems, LineItem } from './InvoiceLineItems';
import { CompanyBrandingForm } from './CompanyBrandingForm';
import { InvoicePreviewDialog } from './InvoicePreviewDialog';
import { ArrowLeft, Save, Send, Building2, FileDown, Eye } from 'lucide-react';
import { InvoiceClient, CreatedInvoice } from '@/types/invoices';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationBranding } from '@/hooks/finance/useOrganizationBranding';
import { supabase } from '@/integrations/supabase/client';
import { generateInvoicePDF } from '@/utils/generateInvoicePDF';
import { useInvoiceTeams } from '@/hooks/useInvoiceTeams';

interface InvoiceBuilderProps {
  onBack?: () => void;
  onInvoiceCreated?: () => void;
}

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ onBack, onInvoiceCreated }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { branding, refreshBranding } = useOrganizationBranding();
  const { teams, isLoading: teamsLoading } = useInvoiceTeams();
  const [organizationName, setOrganizationName] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<InvoiceClient | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
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
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showBrandingDialog, setShowBrandingDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState<CreatedInvoice | null>(null);

  // Fetch organization name
  useEffect(() => {
    const fetchOrgName = async () => {
      if (!user?.organizationId) return;
      const { data } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', user.organizationId)
        .maybeSingle();
      if (data) setOrganizationName(data.name);
    };
    fetchOrgName();
  }, [user?.organizationId]);

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

    // Validate team selection for managers
    if (user?.role === 'manager' && !selectedTeamId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a team for this invoice',
        variant: 'destructive'
      });
      return;
    }

    if (!user?.organizationId) {
      toast({
        title: 'Error',
        description: 'Organization not found',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSaving(true);

      // Validate calculations before saving
      const subtotal = parseFloat(calculations.subtotal.toFixed(2));
      const taxAmount = parseFloat(calculations.tax_amount.toFixed(2));
      const total = parseFloat(calculations.total.toFixed(2));

      if (isNaN(subtotal) || isNaN(taxAmount) || isNaN(total)) {
        throw new Error('Invalid calculation values. Please check line items.');
      }

      console.log('[Invoice Save] Calculations:', { subtotal, taxAmount, total });

      // 1. Insert invoice into created_invoices table
      const { data: invoice, error: invoiceError } = await supabase
        .from('created_invoices')
        .insert({
          organization_id: user.organizationId,
          client_id: selectedClient.id,
          created_by: user.id,
          team_id: selectedTeamId && selectedTeamId !== 'unassigned' ? selectedTeamId : null,
          invoice_number: invoiceData.invoice_number,
          status: 'draft',
          payment_status: 'pending',
          issue_date: invoiceData.issue_date,
          due_date: invoiceData.due_date,
          subtotal,
          tax_amount: taxAmount,
          total_amount: total,
          paid_amount: 0,
          balance_due: total,
          payment_terms: invoiceData.payment_terms,
          notes: invoiceData.notes,
          footer_text: invoiceData.footer_text,
          // Snapshot company branding
          company_logo_url: branding?.logo_url,
          company_name: organizationName,
          company_address: branding?.company_address
            ? `${branding.company_address}${branding.company_city ? `, ${branding.company_city}` : ''}${branding.company_state ? `, ${branding.company_state}` : ''} ${branding.company_postal_code || ''}`.trim()
            : undefined,
          company_phone: branding?.company_phone,
          company_email: branding?.company_email,
        })
        .select()
        .single();

      if (invoiceError) {
        console.error('[Invoice Save] Database error:', invoiceError);
        throw invoiceError;
      }

      console.log('[Invoice Save] Invoice created:', invoice.id);

      // 2. Insert line items
      const lineItemsData = lineItems.map((item, index) => ({
        invoice_id: invoice.id,
        organization_id: user.organizationId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        sort_order: index,
      }));

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItemsData);

      if (lineItemsError) throw lineItemsError;

      // 3. Prepare full invoice for PDF
      const fullInvoice: CreatedInvoice = {
        ...invoice,
        status: 'draft' as const,
        payment_status: 'pending' as const,
        client: selectedClient,
        line_items: lineItems.map((item, index) => ({
          id: '', // Temporary ID
          invoice_id: invoice.id,
          organization_id: user.organizationId,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          sort_order: index,
          created_at: new Date().toISOString(),
        })),
      };

      setSavedInvoice(fullInvoice);

      // 4. Generate and save PDF
      console.log('Generating PDF for invoice:', invoice.invoice_number);
      try {
        generateInvoicePDF(fullInvoice);
        console.log('PDF generation completed successfully');
      } catch (pdfError) {
        console.error('PDF generation failed:', pdfError);
      }

      toast({
        title: 'Success!',
        description: 'Invoice saved and PDF generated',
      });

      onInvoiceCreated?.();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save invoice',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!selectedClient?.email) {
      toast({
        title: 'Error',
        description: 'Client must have an email address to send invoice',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedClient || lineItems.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select a client and add at least one line item',
        variant: 'destructive'
      });
      return;
    }

    if (user?.role === 'manager' && !selectedTeamId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a team for this invoice',
        variant: 'destructive'
      });
      return;
    }

    if (!user?.organizationId) {
      toast({
        title: 'Error',
        description: 'Organization not found',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSending(true);

      // Validate calculations
      const subtotal = parseFloat(calculations.subtotal.toFixed(2));
      const taxAmount = parseFloat(calculations.tax_amount.toFixed(2));
      const total = parseFloat(calculations.total.toFixed(2));

      if (isNaN(subtotal) || isNaN(taxAmount) || isNaN(total)) {
        throw new Error('Invalid calculation values. Please check line items.');
      }

      console.log('[Invoice Send] Creating invoice for:', selectedClient.email);

      // 1. Save invoice as 'sent'
      const { data: invoice, error: invoiceError } = await supabase
        .from('created_invoices')
        .insert({
          organization_id: user.organizationId,
          client_id: selectedClient.id,
          created_by: user.id,
          team_id: selectedTeamId && selectedTeamId !== 'unassigned' ? selectedTeamId : null,
          invoice_number: invoiceData.invoice_number,
          status: 'sent',
          payment_status: 'pending',
          issue_date: invoiceData.issue_date,
          due_date: invoiceData.due_date,
          subtotal,
          tax_amount: taxAmount,
          total_amount: total,
          paid_amount: 0,
          balance_due: total,
          payment_terms: invoiceData.payment_terms,
          notes: invoiceData.notes,
          footer_text: invoiceData.footer_text,
          sent_at: new Date().toISOString(),
          company_logo_url: branding?.logo_url,
          company_name: organizationName,
          company_address: branding?.company_address
            ? `${branding.company_address}${branding.company_city ? `, ${branding.company_city}` : ''}${branding.company_state ? `, ${branding.company_state}` : ''} ${branding.company_postal_code || ''}`.trim()
            : undefined,
          company_phone: branding?.company_phone,
          company_email: branding?.company_email,
        })
        .select()
        .single();

      if (invoiceError) {
        console.error('[Invoice Send] Database error:', invoiceError);
        throw invoiceError;
      }

      // 2. Insert line items
      const lineItemsData = lineItems.map((item, index) => ({
        invoice_id: invoice.id,
        organization_id: user.organizationId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        sort_order: index,
      }));

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItemsData);

      if (lineItemsError) throw lineItemsError;

      console.log('[Invoice Send] Sending email to:', selectedClient.email);

      // 3. Send email via edge function
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId: invoice.id,
          clientEmail: selectedClient.email,
          clientName: selectedClient.name,
          invoiceNumber: invoiceData.invoice_number,
          issueDate: invoiceData.issue_date,
          dueDate: invoiceData.due_date,
          totalAmount: total,
          companyName: organizationName,
          companyEmail: branding?.company_email,
          paymentTerms: invoiceData.payment_terms,
          notes: invoiceData.notes,
          lineItems: lineItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          })),
        }
      });

      if (emailError) {
        console.error('[Invoice Send] Email error:', emailError);
        toast({
          title: 'Partial Success',
          description: 'Invoice saved but email failed to send. You can resend from the invoice list.',
          variant: 'destructive',
        });
      } else {
        console.log('[Invoice Send] Email sent successfully');
        toast({
          title: 'Success!',
          description: `Invoice sent to ${selectedClient.email}`,
        });
      }

      // 4. Generate PDF
      const fullInvoice: CreatedInvoice = {
        ...invoice,
        status: 'sent' as const,
        payment_status: 'pending' as const,
        client: selectedClient,
        line_items: lineItems.map((item, index) => ({
          id: '',
          invoice_id: invoice.id,
          organization_id: user.organizationId,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          sort_order: index,
          created_at: new Date().toISOString(),
        })),
      };

      setSavedInvoice(fullInvoice);
      generateInvoicePDF(fullInvoice);

      onInvoiceCreated?.();
    } catch (error: any) {
      console.error('[Invoice Send] Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invoice',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handlePreview = () => {
    if (!selectedClient || lineItems.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select a client and add at least one line item',
        variant: 'destructive'
      });
      return;
    }

    // Create preview invoice object
    const previewInvoice: CreatedInvoice = {
      id: 'preview',
      organization_id: user?.organizationId || '',
      client_id: selectedClient.id,
      created_by: user?.id || '',
      invoice_number: invoiceData.invoice_number,
      status: 'draft',
      payment_status: 'pending',
      issue_date: invoiceData.issue_date,
      due_date: invoiceData.due_date,
      subtotal: calculations.subtotal,
      tax_amount: calculations.tax_amount,
      total_amount: calculations.total,
      paid_amount: 0,
      balance_due: calculations.total,
      payment_terms: invoiceData.payment_terms,
      notes: invoiceData.notes,
      footer_text: invoiceData.footer_text,
      company_logo_url: branding?.logo_url,
      company_name: organizationName,
      company_address: branding?.company_address
        ? `${branding.company_address}${branding.company_city ? `, ${branding.company_city}` : ''}${branding.company_state ? `, ${branding.company_state}` : ''} ${branding.company_postal_code || ''}`.trim()
        : undefined,
      company_phone: branding?.company_phone,
      company_email: branding?.company_email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      client: selectedClient,
      line_items: lineItems.map((item, index) => ({
        id: `temp-${index}`,
        invoice_id: 'preview',
        organization_id: user?.organizationId || '',
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        sort_order: index,
        created_at: new Date().toISOString(),
      })),
    };

    setSavedInvoice(previewInvoice);
    setShowPreview(true);
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
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving || isSending}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save & Download'}
          </Button>
          <Button onClick={handleSendInvoice} disabled={isSaving || isSending}>
            <Send className="h-4 w-4 mr-2" />
            {isSending ? 'Sending...' : 'Send Invoice'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Company Information
              <Dialog 
                open={showBrandingDialog} 
                onOpenChange={(open) => {
                  setShowBrandingDialog(open);
                  if (!open) {
                    // Refresh branding when dialog closes
                    refreshBranding();
                  }
                }}
              >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Building2 className="h-4 w-4 mr-2" />
                      Edit Branding
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Company Branding</DialogTitle>
                    </DialogHeader>
                    <CompanyBrandingForm />
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                {branding?.logo_url ? (
                  <img
                    src={branding.logo_url}
                    alt="Company Logo"
                    className="h-16 w-16 object-contain rounded border"
                  />
                ) : (
                  <div className="h-16 w-16 bg-muted rounded flex items-center justify-center border">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 text-sm space-y-0.5">
                  <p className="font-semibold text-base">{organizationName || 'Company Name'}</p>
                  {branding?.company_address && (
                    <p className="text-muted-foreground">
                      {branding.company_address}
                      {branding?.company_city && `, ${branding.company_city}`}
                      {branding?.company_state && `, ${branding.company_state}`}
                      {branding?.company_postal_code && ` ${branding.company_postal_code}`}
                    </p>
                  )}
                  {branding?.company_country && (
                    <p className="text-muted-foreground">{branding.company_country}</p>
                  )}
                  {branding?.company_phone && (
                    <p className="text-muted-foreground">{branding.company_phone}</p>
                  )}
                  {branding?.company_email && (
                    <p className="text-muted-foreground">{branding.company_email}</p>
                  )}
                  {branding?.company_website && (
                    <p className="text-muted-foreground">{branding.company_website}</p>
                  )}
                  {!branding?.logo_url && !branding?.company_address && !branding?.company_phone && !branding?.company_email && (
                    <p className="text-muted-foreground text-xs mt-2">
                      Click "Edit Branding" to add your company logo and information
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Team Selection */}
          {teams.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Team Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="team">
                    Team {user?.role === 'manager' && <span className="text-destructive">*</span>}
                  </Label>
                  <Select
                    value={selectedTeamId}
                    onValueChange={setSelectedTeamId}
                    disabled={teamsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={teamsLoading ? 'Loading teams...' : 'Select a team'} />
                    </SelectTrigger>
                    <SelectContent>
                      {user?.role !== 'manager' && (
                        <SelectItem value="unassigned">No team (organization-wide)</SelectItem>
                      )}
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {user?.role === 'manager' && (
                    <p className="text-xs text-muted-foreground">
                      Required: Select the team this invoice belongs to
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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

      {/* Invoice Preview Dialog */}
      {savedInvoice && (
        <InvoicePreviewDialog
          open={showPreview}
          onOpenChange={setShowPreview}
          invoice={savedInvoice}
        />
      )}
    </div>
  );
};