
import React, { useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Users, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTeamAccess } from '@/hooks/useTeamAccess';
import { useAuth } from '@/contexts/AuthContext';
import { VendorSelector } from './VendorSelector';
import { ExpenseCategorySelector } from './ExpenseCategorySelector';
import { FinancialDetailsSection } from './FinancialDetailsSection';
import { InvoiceNotesAndTags } from './InvoiceNotesAndTags';

interface InvoiceFormFieldsProps {
  invoiceNumber: string;
  setInvoiceNumber: (value: string) => void;
  invoiceDate: Date | undefined;
  setInvoiceDate: (date: Date | undefined) => void;
  teamId: string;
  setTeamId: (value: string) => void;
  vendorId: string;
  setVendorId: (value: string) => void;
  expenseCategoryId: string;
  setExpenseCategoryId: (value: string) => void;
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
  notes: string;
  setNotes: (value: string) => void;
  tags: string;
  setTags: (value: string) => void;
  isUploading: boolean;
}

const InvoiceFormFields: React.FC<InvoiceFormFieldsProps> = ({
  invoiceNumber,
  setInvoiceNumber,
  invoiceDate,
  setInvoiceDate,
  teamId,
  setTeamId,
  vendorId,
  setVendorId,
  expenseCategoryId,
  setExpenseCategoryId,
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
  notes,
  setNotes,
  tags,
  setTags,
  isUploading
}) => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { availableTeams: teams, isLoading: teamsLoading, error } = useTeamAccess();
  const teamsError = error ? 'Failed to load teams' : null;

  // Auto-set payment due date 30 days after invoice date
  useEffect(() => {
    if (invoiceDate && !paymentDueDate) {
      setPaymentDueDate(addDays(invoiceDate, 30));
    }
  }, [invoiceDate, paymentDueDate, setPaymentDueDate]);

  return (
    <div className={cn("space-y-6", isMobile ? "gap-4" : "gap-6")}>
      {/* Basic Invoice Information */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Basic Information
        </h3>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="invoiceNumber" className={isMobile ? "text-base font-semibold" : "text-sm font-medium"}>
              Invoice Number *
            </Label>
            <Input
              id="invoiceNumber"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Enter invoice number"
              className={isMobile ? "h-14 text-lg border-2" : "h-10 border-2"}
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
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="team" className={isMobile ? "text-base font-semibold" : "text-sm font-medium"}>
              Team *
            </Label>
            {teamsError ? (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive border border-destructive/20 rounded-md bg-destructive/5">
                <AlertCircle className="h-4 w-4" />
                <span>Error loading teams: {teamsError}</span>
              </div>
            ) : teams.length === 0 && !teamsLoading ? (
              <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground border border-border rounded-md bg-muted/50">
                <Users className="h-4 w-4" />
                <span>
                  {user?.role === 'manager' 
                    ? 'You are not managing any teams. Contact your admin to be assigned as a team manager.'
                    : 'No teams available in your organization.'
                  }
                </span>
              </div>
            ) : (
              <Select
                value={teamId}
                onValueChange={setTeamId}
                disabled={isUploading || teamsLoading || teams.length === 0}
              >
                <SelectTrigger className={cn(
                  "w-full border-2", 
                  isMobile ? "h-14 text-lg" : "h-10"
                )}>
                  <SelectValue 
                    placeholder={teamsLoading ? "Loading teams..." : "Select team"} 
                  />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{team.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({team.member_count} members)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Vendor and Category */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Vendor & Category
        </h3>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label className={isMobile ? "text-base font-semibold" : "text-sm font-medium"}>
              Vendor *
            </Label>
            <VendorSelector
              value={vendorId}
              onValueChange={setVendorId}
              disabled={isUploading}
            />
          </div>

          <div className="grid gap-2">
            <Label className={isMobile ? "text-base font-semibold" : "text-sm font-medium"}>
              Expense Category *
            </Label>
            <ExpenseCategorySelector
              value={expenseCategoryId}
              onValueChange={setExpenseCategoryId}
              disabled={isUploading}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Financial Details */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Financial Details
        </h3>
        <FinancialDetailsSection
          invoiceTotal={invoiceTotal}
          setInvoiceTotal={setInvoiceTotal}
          currency={currency}
          setCurrency={setCurrency}
          paymentDueDate={paymentDueDate}
          setPaymentDueDate={setPaymentDueDate}
          paymentStatus={paymentStatus}
          setPaymentStatus={setPaymentStatus}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          referenceNumber={referenceNumber}
          setReferenceNumber={setReferenceNumber}
          isDisabled={isUploading}
          invoiceDate={invoiceDate}
        />
      </div>

      <Separator />

      {/* Notes and Tags */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Additional Information
        </h3>
        <InvoiceNotesAndTags
          notes={notes}
          setNotes={setNotes}
          tags={tags}
          setTags={setTags}
          isDisabled={isUploading}
        />
      </div>
    </div>
  );
};

export default InvoiceFormFields;
