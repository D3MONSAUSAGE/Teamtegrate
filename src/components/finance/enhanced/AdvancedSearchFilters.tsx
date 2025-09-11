import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Search, 
  Filter, 
  X, 
  DollarSign, 
  Users, 
  MapPin, 
  CreditCard,
  Calendar,
  Save,
  RotateCcw,
  TrendingUp,
  Hash
} from 'lucide-react';

interface FilterCriteria {
  searchTerm: string;
  amountRange: [number, number];
  teamIds: string[];
  posSystemIds: string[];
  transactionTypes: string[];
  locations: string[];
  dateOperator: 'between' | 'before' | 'after' | 'on';
  customFields: Record<string, any>;
}

interface SavedFilter {
  id: string;
  name: string;
  criteria: FilterCriteria;
  createdAt: Date;
  usageCount: number;
}

interface AdvancedSearchFiltersProps {
  criteria: FilterCriteria;
  onCriteriaChange: (criteria: FilterCriteria) => void;
  availableTeams?: Array<{ id: string; name: string }>;
  availablePosSystems?: Array<{ id: string; name: string }>;
  availableLocations?: Array<{ id: string; name: string }>;
  savedFilters?: SavedFilter[];
  onSaveFilter?: (filter: Omit<SavedFilter, 'id' | 'createdAt' | 'usageCount'>) => void;
  onLoadFilter?: (filter: SavedFilter) => void;
  onDeleteFilter?: (filterId: string) => void;
  dataStats?: {
    totalRecords: number;
    filteredRecords: number;
    amountRange: [number, number];
    avgAmount: number;
  };
}

export const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  criteria,
  onCriteriaChange,
  availableTeams = [],
  availablePosSystems = [],
  availableLocations = [],
  savedFilters = [],
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter,
  dataStats
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['search', 'amount']));

  const transactionTypes = [
    { id: 'sale', name: 'Sales' },
    { id: 'refund', name: 'Refunds' },
    { id: 'void', name: 'Voids' },
    { id: 'discount', name: 'Discounts' },
    { id: 'comp', name: 'Comps' }
  ];

  const dateOperators = [
    { value: 'between', label: 'Between dates' },
    { value: 'before', label: 'Before date' },
    { value: 'after', label: 'After date' },
    { value: 'on', label: 'On specific date' }
  ];

  const updateCriteria = (updates: Partial<FilterCriteria>) => {
    onCriteriaChange({ ...criteria, ...updates });
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const clearAllFilters = () => {
    const defaultCriteria: FilterCriteria = {
      searchTerm: '',
      amountRange: dataStats ? dataStats.amountRange : [0, 10000],
      teamIds: [],
      posSystemIds: [],
      transactionTypes: [],
      locations: [],
      dateOperator: 'between',
      customFields: {}
    };
    onCriteriaChange(defaultCriteria);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (criteria.searchTerm) count++;
    if (criteria.teamIds.length > 0) count++;
    if (criteria.posSystemIds.length > 0) count++;
    if (criteria.transactionTypes.length > 0) count++;
    if (criteria.locations.length > 0) count++;
    if (criteria.amountRange[0] > (dataStats?.amountRange[0] || 0) || 
        criteria.amountRange[1] < (dataStats?.amountRange[1] || 10000)) count++;
    return count;
  };

  const handleSaveFilter = () => {
    if (!filterName.trim() || !onSaveFilter) return;
    
    onSaveFilter({
      name: filterName.trim(),
      criteria: { ...criteria }
    });
    
    setFilterName('');
    setShowSaveDialog(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Advanced Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFilterCount()} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              disabled={getActiveFilterCount() === 0}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear All
            </Button>
            {onSaveFilter && getActiveFilterCount() > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
              >
                <Save className="h-4 w-4 mr-1" />
                Save Filter
              </Button>
            )}
          </div>
        </div>

        {/* Data Stats Summary */}
        {dataStats && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Records</p>
              <p className="text-lg font-semibold">{dataStats.totalRecords.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Filtered Results</p>
              <p className="text-lg font-semibold text-primary">{dataStats.filteredRecords.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Amount Range</p>
              <p className="text-sm font-medium">
                {formatCurrency(dataStats.amountRange[0])} - {formatCurrency(dataStats.amountRange[1])}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Avg Amount</p>
              <p className="text-lg font-semibold">{formatCurrency(dataStats.avgAmount)}</p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search Section */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between p-0 h-auto"
            onClick={() => toggleSection('search')}
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="font-medium">Text Search</span>
              {criteria.searchTerm && <Badge variant="outline" className="text-xs">Active</Badge>}
            </div>
          </Button>
          
          {expandedSections.has('search') && (
            <div className="space-y-3 pl-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions, notes, references..."
                  value={criteria.searchTerm}
                  onChange={(e) => updateCriteria({ searchTerm: e.target.value })}
                  className="pl-10"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Search across transaction IDs, notes, customer names, and reference numbers
              </div>
            </div>
          )}
        </div>

        {/* Amount Range Section */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between p-0 h-auto"
            onClick={() => toggleSection('amount')}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium">Amount Range</span>
              {(criteria.amountRange[0] > (dataStats?.amountRange[0] || 0) || 
                criteria.amountRange[1] < (dataStats?.amountRange[1] || 10000)) && 
                <Badge variant="outline" className="text-xs">Active</Badge>
              }
            </div>
          </Button>
          
          {expandedSections.has('amount') && (
            <div className="space-y-4 pl-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>{formatCurrency(criteria.amountRange[0])}</span>
                  <span>{formatCurrency(criteria.amountRange[1])}</span>
                </div>
                <Slider
                  value={criteria.amountRange}
                  onValueChange={(value) => updateCriteria({ amountRange: value as [number, number] })}
                  max={dataStats?.amountRange[1] || 10000}
                  min={dataStats?.amountRange[0] || 0}
                  step={10}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min amount"
                  value={criteria.amountRange[0]}
                  onChange={(e) => updateCriteria({ 
                    amountRange: [parseFloat(e.target.value) || 0, criteria.amountRange[1]] 
                  })}
                />
                <Input
                  type="number"
                  placeholder="Max amount"
                  value={criteria.amountRange[1]}
                  onChange={(e) => updateCriteria({ 
                    amountRange: [criteria.amountRange[0], parseFloat(e.target.value) || 0] 
                  })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Teams Section */}
        {availableTeams.length > 0 && (
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between p-0 h-auto"
              onClick={() => toggleSection('teams')}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">Teams</span>
                {criteria.teamIds.length > 0 && (
                  <Badge variant="outline" className="text-xs">{criteria.teamIds.length} selected</Badge>
                )}
              </div>
            </Button>
            
            {expandedSections.has('teams') && (
              <div className="space-y-2 pl-6">
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {availableTeams.map(team => (
                    <label key={team.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={criteria.teamIds.includes(team.id)}
                        onChange={(e) => {
                          const newTeamIds = e.target.checked
                            ? [...criteria.teamIds, team.id]
                            : criteria.teamIds.filter(id => id !== team.id);
                          updateCriteria({ teamIds: newTeamIds });
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{team.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* POS Systems Section */}
        {availablePosSystems.length > 0 && (
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between p-0 h-auto"
              onClick={() => toggleSection('pos')}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="font-medium">POS Systems</span>
                {criteria.posSystemIds.length > 0 && (
                  <Badge variant="outline" className="text-xs">{criteria.posSystemIds.length} selected</Badge>
                )}
              </div>
            </Button>
            
            {expandedSections.has('pos') && (
              <div className="space-y-2 pl-6">
                <div className="grid grid-cols-1 gap-2">
                  {availablePosSystems.map(pos => (
                    <label key={pos.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={criteria.posSystemIds.includes(pos.id)}
                        onChange={(e) => {
                          const newPosIds = e.target.checked
                            ? [...criteria.posSystemIds, pos.id]
                            : criteria.posSystemIds.filter(id => id !== pos.id);
                          updateCriteria({ posSystemIds: newPosIds });
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{pos.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transaction Types */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between p-0 h-auto"
            onClick={() => toggleSection('types')}
          >
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              <span className="font-medium">Transaction Types</span>
              {criteria.transactionTypes.length > 0 && (
                <Badge variant="outline" className="text-xs">{criteria.transactionTypes.length} selected</Badge>
              )}
            </div>
          </Button>
          
          {expandedSections.has('types') && (
            <div className="space-y-2 pl-6">
              <div className="grid grid-cols-2 gap-2">
                {transactionTypes.map(type => (
                  <label key={type.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={criteria.transactionTypes.includes(type.id)}
                      onChange={(e) => {
                        const newTypes = e.target.checked
                          ? [...criteria.transactionTypes, type.id]
                          : criteria.transactionTypes.filter(id => id !== type.id);
                        updateCriteria({ transactionTypes: newTypes });
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{type.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Save className="h-4 w-4" />
              Saved Filters
            </h4>
            <div className="space-y-2">
              {savedFilters.slice(0, 3).map(filter => (
                <div key={filter.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 justify-start h-auto"
                    onClick={() => onLoadFilter?.(filter)}
                  >
                    <div className="text-left">
                      <p className="font-medium text-sm">{filter.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Used {filter.usageCount} times • {filter.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </Button>
                  {onDeleteFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteFilter(filter.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Save Filter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Filter name..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveFilter} disabled={!filterName.trim()}>
                  Save Filter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
};