
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

interface InvoiceFormFieldsProps {
  invoiceNumber: string;
  setInvoiceNumber: (value: string) => void;
  invoiceDate: Date | undefined;
  setInvoiceDate: (date: Date | undefined) => void;
  branch: string;
  setBranch: (value: string) => void;
  isUploading: boolean;
}

const InvoiceFormFields: React.FC<InvoiceFormFieldsProps> = ({
  invoiceNumber,
  setInvoiceNumber,
  invoiceDate,
  setInvoiceDate,
  branch,
  setBranch,
  isUploading
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={cn("grid gap-4", isMobile ? "gap-4" : "gap-6")}>
      <div className="grid gap-2">
        <Label htmlFor="invoiceNumber" className={isMobile ? "text-base font-semibold" : "text-sm font-medium"}>
          Invoice Number *
        </Label>
        <Input
          id="invoiceNumber"
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          placeholder="Enter invoice number"
          className={isMobile ? "h-14 text-lg border-2" : "h-10"}
          disabled={isUploading}
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="invoiceDate" className={isMobile ? "text-base font-semibold" : "text-sm font-medium"}>
          Invoice Date *
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal border-2",
                isMobile ? "h-14 text-lg" : "h-10",
                !invoiceDate && "text-muted-foreground"
              )}
              disabled={isUploading}
            >
              <CalendarIcon className={cn("mr-2", isMobile ? "h-5 w-5" : "h-4 w-4")} />
              {invoiceDate ? format(invoiceDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={invoiceDate}
              onSelect={setInvoiceDate}
              disabled={(date) => date > new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="branch" className={isMobile ? "text-base font-semibold" : "text-sm font-medium"}>
          Branch/Location *
        </Label>
        <Input
          id="branch"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          placeholder="Enter branch or location"
          className={isMobile ? "h-14 text-lg border-2" : "h-10"}
          disabled={isUploading}
        />
      </div>
    </div>
  );
};

export default InvoiceFormFields;
