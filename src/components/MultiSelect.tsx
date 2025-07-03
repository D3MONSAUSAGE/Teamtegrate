
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MultiSelectProps {
  onChange: (value: string[]) => void;
  placeholder?: string;
  options?: { value: string; label: string; }[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ 
  onChange, 
  placeholder = "Select team members...",
  options = [],
  isLoading = false,
  error = null,
  onRetry
}) => {
  const [open, setOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const handleSelect = (value: string) => {
    if (!value) return;
    
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    
    setSelectedValues(newValues);
    onChange(newValues);
  };

  // Ensure options is always a valid array with proper validation
  const safeOptions = Array.isArray(options) ? options.filter(option => 
    option && 
    typeof option === 'object' && 
    option.value && 
    option.label &&
    typeof option.value === 'string' &&
    typeof option.label === 'string' &&
    option.value.trim() !== ''
  ) : [];

  // Show error state with retry option
  if (error) {
    return (
      <div className="grid gap-2">
        <Label>Team Members</Label>
        <div className="flex items-center gap-2 p-3 border border-destructive/50 rounded-md bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <span className="text-sm text-destructive">Failed to load team members</span>
          </div>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Don't render the complex Command component if we don't have safe data
  if (isLoading || !Array.isArray(options) || safeOptions.length === 0) {
    return (
      <div className="grid gap-2">
        <Label>Team Members</Label>
        <Button
          variant="outline"
          role="combobox"
          className="justify-between"
          disabled={true}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading members...
            </>
          ) : (
            "No team members available"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
        {!isLoading && safeOptions.length === 0 && (
          <p className="text-xs text-muted-foreground">No team members available to select.</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Label>Team Members</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between"
          >
            {selectedValues.length > 0 ? (
              `${selectedValues.length} selected`
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" style={{ zIndex: 9999 }}>
          <Command>
            <CommandInput placeholder="Search members..." />
            <CommandEmpty>No members found.</CommandEmpty>
            <CommandGroup>
              {safeOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValues.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MultiSelect;
