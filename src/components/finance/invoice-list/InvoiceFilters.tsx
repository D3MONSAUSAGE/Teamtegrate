
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Calendar, Building } from 'lucide-react';

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

interface InvoiceFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedBranch: string;
  setSelectedBranch: (value: string) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
  onClearFilters: () => void;
}

const InvoiceFilters: React.FC<InvoiceFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedBranch,
  setSelectedBranch,
  dateFilter,
  setDateFilter,
  onClearFilters
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search by invoice # or uploader..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

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

      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="pl-10"
        />
      </div>

      <Button variant="outline" onClick={onClearFilters}>
        Clear Filters
      </Button>
    </div>
  );
};

export default InvoiceFilters;
