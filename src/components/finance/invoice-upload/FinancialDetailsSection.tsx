import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

interface FinancialDetailsSectionProps {
  invoiceTotal: string;
  setInvoiceTotal: (value: string) => void;
  currency: string;
  setCurrency: (value: string) => void;
  paymentDueDate: Date | undefined;
  setPaymentDueDate: (date: Date | undefined) => void;
  paymentStatus: string;
  setPaymentStatus: (value: string) => void;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  referenceNumber: string;
  setReferenceNumber: (value: string) => void;
  isDisabled?: boolean;
  invoiceDate?: Date;
}

const PAYMENT_STATUS_OPTIONS = [
  { value: 'unpaid', label: 'Unpaid', color: 'destructive' },
  { value: 'partial', label: 'Partially Paid', color: 'warning' },
  { value: 'paid', label: 'Paid', color: 'success' },
  { value: 'void', label: 'Void', color: 'secondary' }
] as const;

const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: 'Select method' },
  { value: 'check', label: 'Check' },
  { value: 'wire_transfer', label: 'Wire Transfer' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' }
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'CAD', label: 'CAD ($)', symbol: 'C$' },
  { value: 'MXN', label: 'MXN ($)', symbol: 'MX$' }
];

export const FinancialDetailsSection: React.FC<FinancialDetailsSectionProps> = ({
  invoiceTotal,
  setInvoiceTotal,
  currency,
  setCurrency,
  paymentDueDate,
  setPaymentDueDate,
  paymentStatus,
  setPaymentStatus,
  paymentMethod,
  setPaymentMethod,
  referenceNumber,
  setReferenceNumber,
  isDisabled,
  invoiceDate
}) => {
  const isMobile = useIsMobile();
  const currencySymbol = CURRENCY_OPTIONS.find(c => c.value === currency)?.symbol || '$';

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Invoice Total */}
        <div className="grid gap-2">
          <Label htmlFor="invoiceTotal" className={isMobile ? "text-base font-semibold" : "text-sm font-medium"}>
            Invoice Total *
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="invoiceTotal"
              type="number"
              step="0.01"
              min="0"
              value={invoiceTotal}
              onChange={(e) => setInvoiceTotal(e.target.value)}
              placeholder="0.00"
              className={cn("pl-10 border-2", isMobile ? "h-14 text-lg" : "h-10")}
              disabled={isDisabled}
            />
          </div>
        </div>

        {/* Currency */}
        <div className="grid gap-2">
          <Label htmlFor="currency" className={isMobile ? "text-base font-semibold" : "text-sm font-medium"}>
            Currency
          </Label>
          <Select value={currency} onValueChange={setCurrency} disabled={isDisabled}>
            <SelectTrigger className={cn("w-full border-2", isMobile ? "h-14 text-lg" : "h-10")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((curr) => (
                <SelectItem key={curr.value} value={curr.value}>
                  {curr.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Payment Due Date */}
        <div className="grid gap-2">
          <Label htmlFor="paymentDueDate" className={isMobile ? "text-base font-semibold" : "text-sm font-medium"}>
            Payment Due Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal border-2",
                  isMobile ? "h-14 text-lg" : "h-10",
                  !paymentDueDate && "text-muted-foreground"
                )}
                disabled={isDisabled}
              >
                <CalendarIcon className={cn("mr-2", isMobile ? "h-5 w-5" : "h-4 w-4")} />
                {paymentDueDate ? format(paymentDueDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={paymentDueDate}
                onSelect={setPaymentDueDate}
                disabled={(date) => invoiceDate ? date < invoiceDate : false}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Payment Status */}
        <div className="grid gap-2">
          <Label htmlFor="paymentStatus" className={isMobile ? "text-base font-semibold" : "text-sm font-medium"}>
            Payment Status
          </Label>
          <Select value={paymentStatus} onValueChange={setPaymentStatus} disabled={isDisabled}>
            <SelectTrigger className={cn("w-full border-2", isMobile ? "h-14 text-lg" : "h-10")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  <div className="flex items-center gap-2">
                    <Badge variant={status.color as any} className="text-xs">
                      {status.label}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Payment Method */}
        <div className="grid gap-2">
          <Label htmlFor="paymentMethod" className={isMobile ? "text-base font-semibold" : "text-sm font-medium"}>
            Payment Method
          </Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={isDisabled}>
            <SelectTrigger className={cn("w-full border-2", isMobile ? "h-14 text-lg" : "h-10")}>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHOD_OPTIONS.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reference Number */}
        <div className="grid gap-2">
          <Label htmlFor="referenceNumber" className={isMobile ? "text-base font-semibold" : "text-sm font-medium"}>
            Reference Number
          </Label>
          <Input
            id="referenceNumber"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="Check #, Wire ref, etc."
            className={cn("border-2", isMobile ? "h-14 text-lg" : "h-10")}
            disabled={isDisabled}
          />
        </div>
      </div>
    </div>
  );
};
