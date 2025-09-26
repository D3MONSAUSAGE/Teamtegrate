import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Building2, Plus } from 'lucide-react';
import { Vendor } from '@/contexts/inventory/types';

interface VendorSelectorProps {
  vendors: Vendor[];
  value?: string;
  onValueChange: (value: string | undefined) => void;
  onAddVendor?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const VendorSelector: React.FC<VendorSelectorProps> = ({
  vendors,
  value,
  onValueChange,
  onAddVendor,
  placeholder = "Select vendor...",
  disabled = false
}) => {
  return (
    <div className="flex gap-2">
      <Select 
        value={value || ''} 
        onValueChange={(val) => onValueChange(val || undefined)}
        disabled={disabled}
      >
        <SelectTrigger className="flex-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <SelectValue placeholder={placeholder} />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">
            <span className="text-muted-foreground">None</span>
          </SelectItem>
          {vendors.map((vendor) => (
            <SelectItem key={vendor.id} value={vendor.id}>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>{vendor.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {onAddVendor && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddVendor}
          disabled={disabled}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};