
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, AlertCircle, Loader2 } from "lucide-react";
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
}

const MultiSelect: React.FC<MultiSelectProps> = ({ 
  onChange, 
  placeholder = "Select team members...",
  options = [],
  isLoading = false,
  error = null
}) => {
  const [open, setOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const handleSelect = (value: string) => {
    if (!value) return; // Prevent empty values
    
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    
    setSelectedValues(newValues);
    onChange(newValues);
  };

  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];
  
  // Show error state
  if (error) {
    return (
      <div className="grid gap-2">
        <Label>Team Members</Label>
        <div className="flex items-center gap-2 p-3 border border-destructive/50 rounded-md bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">Failed to load team members</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Label>Team Members</Label>
      <Popover open={open && !isLoading} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading members...
              </>
            ) : selectedValues.length > 0 ? (
              `${selectedValues.length} selected`
            ) : (
              placeholder
            )}
            {!isLoading && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" style={{ zIndex: 9999 }}>
          <Command>
            <CommandInput placeholder="Search members..." />
            <CommandEmpty>
              {safeOptions.length === 0 ? "No team members available." : "No members found."}
            </CommandEmpty>
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
      {safeOptions.length === 0 && !isLoading && !error && (
        <p className="text-xs text-muted-foreground">No team members available to select.</p>
      )}
    </div>
  );
};

export default MultiSelect;
