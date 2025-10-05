import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Calendar, Building, DollarSign, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const BRANCH_OPTIONS = [
  'All Branches',
  'Sylmar',
  'Canyon', 
  'Via Princessa',
  'Palmdale',
  'Panorama',
  'Cocina',
  'Corp'
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'void', label: 'Void' }
];

interface InvoiceFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedBranch: string;
  setSelectedBranch: (value: string) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
  selectedVendor: string;
  setSelectedVendor: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  selectedPaymentStatus: string[];
  setSelectedPaymentStatus: (value: string[]) => void;
  minAmount?: number;
  setMinAmount: (value: number | undefined) => void;
  maxAmount?: number;
  setMaxAmount: (value: number | undefined) => void;
  selectedTags: string[];
  setSelectedTags: (value: string[]) => void;
  onClearFilters: () => void;
  uniqueVendors: string[];
  uniqueCategories: string[];
  uniqueTags: string[];
  activeFilterCount: number;
}

const InvoiceFilters: React.FC<InvoiceFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedBranch,
  setSelectedBranch,
  dateFilter,
  setDateFilter,
  selectedVendor,
  setSelectedVendor,
  selectedCategory,
  setSelectedCategory,
  selectedPaymentStatus,
  setSelectedPaymentStatus,
  minAmount,
  setMinAmount,
  maxAmount,
  setMaxAmount,
  selectedTags,
  setSelectedTags,
  onClearFilters,
  uniqueVendors,
  uniqueCategories,
  uniqueTags,
  activeFilterCount
}) => {
  const togglePaymentStatus = (status: string) => {
    if (selectedPaymentStatus.includes(status)) {
      setSelectedPaymentStatus(selectedPaymentStatus.filter(s => s !== status));
    } else {
      setSelectedPaymentStatus([...selectedPaymentStatus, status]);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {/* First row - Main filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedVendor} onValueChange={setSelectedVendor}>
          <SelectTrigger>
            <Building className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {uniqueVendors.map((vendor) => (
              <SelectItem key={vendor} value={vendor}>
                {vendor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <Tag className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {uniqueCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
          <SelectTrigger>
            <Building className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BRANCH_OPTIONS.map((branch) => (
              <SelectItem key={branch} value={branch}>
                {branch}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Second row - Advanced filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-10"
            placeholder="Invoice Date"
          />
        </div>

        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="number"
            placeholder="Min Amount"
            value={minAmount ?? ''}
            onChange={(e) => setMinAmount(e.target.value ? Number(e.target.value) : undefined)}
            className="pl-10"
          />
        </div>

        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="number"
            placeholder="Max Amount"
            value={maxAmount ?? ''}
            onChange={(e) => setMaxAmount(e.target.value ? Number(e.target.value) : undefined)}
            className="pl-10"
          />
        </div>

        <Button 
          variant="outline" 
          onClick={onClearFilters}
          className="relative"
        >
          Clear Filters
          {activeFilterCount > 0 && (
            <Badge 
              variant="destructive" 
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Payment Status Chips */}
      {PAYMENT_STATUS_OPTIONS.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground font-medium">Payment Status:</span>
          {PAYMENT_STATUS_OPTIONS.map((status) => (
            <Badge
              key={status.value}
              variant={selectedPaymentStatus.includes(status.value) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => togglePaymentStatus(status.value)}
            >
              {status.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Tags Chips */}
      {uniqueTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground font-medium">Tags:</span>
          {uniqueTags.slice(0, 10).map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
          {uniqueTags.length > 10 && (
            <span className="text-xs text-muted-foreground">+{uniqueTags.length - 10} more</span>
          )}
        </div>
      )}
    </div>
  );
};

export default InvoiceFilters;