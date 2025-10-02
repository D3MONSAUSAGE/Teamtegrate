
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Users, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTeamAccess } from '@/hooks/useTeamAccess';
import { useAuth } from '@/contexts/AuthContext';

interface InvoiceFormFieldsProps {
  invoiceNumber: string;
  setInvoiceNumber: (value: string) => void;
  invoiceDate: Date | undefined;
  setInvoiceDate: (date: Date | undefined) => void;
  teamId: string;
  setTeamId: (value: string) => void;
  isUploading: boolean;
}

const InvoiceFormFields: React.FC<InvoiceFormFieldsProps> = ({
  invoiceNumber,
  setInvoiceNumber,
  invoiceDate,
  setInvoiceDate,
  teamId,
  setTeamId,
  isUploading
}) => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { availableTeams: teams, isLoading: teamsLoading, error } = useTeamAccess();
  const teamsError = error ? 'Failed to load teams' : null;

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
  );
};

export default InvoiceFormFields;
