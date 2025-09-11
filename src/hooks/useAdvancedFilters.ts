import { useState, useEffect, useMemo } from 'react';
import { DateRange } from 'react-day-picker';

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

interface FilterStats {
  totalRecords: number;
  filteredRecords: number;
  amountRange: [number, number];
  avgAmount: number;
}

interface UseAdvancedFiltersProps {
  data: any[];
  dateRange?: DateRange;
  onDataChange?: (filteredData: any[]) => void;
}

const STORAGE_KEY = 'advanced-filters';
const SAVED_FILTERS_KEY = 'saved-filters';

export const useAdvancedFilters = ({ 
  data, 
  dateRange, 
  onDataChange 
}: UseAdvancedFiltersProps) => {
  const [criteria, setCriteria] = useState<FilterCriteria>({
    searchTerm: '',
    amountRange: [0, 10000],
    teamIds: [],
    posSystemIds: [],
    transactionTypes: [],
    locations: [],
    dateOperator: 'between',
    customFields: {}
  });

  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved filters from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_FILTERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedFilters(parsed.map((f: any) => ({
          ...f,
          createdAt: new Date(f.createdAt)
        })));
      }

      // Load last used criteria
      const lastCriteria = localStorage.getItem(STORAGE_KEY);
      if (lastCriteria) {
        setCriteria(JSON.parse(lastCriteria));
      }
    } catch (error) {
      console.warn('Failed to load saved filters:', error);
    }
  }, []);

  // Save criteria to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(criteria));
    } catch (error) {
      console.warn('Failed to save filter criteria:', error);
    }
  }, [criteria]);

  // Calculate data stats
  const dataStats: FilterStats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalRecords: 0,
        filteredRecords: 0,
        amountRange: [0, 10000],
        avgAmount: 0
      };
    }

    const amounts = data
      .map(item => parseFloat(item.grossSales || item.netSales || item.amount || 0))
      .filter(amount => !isNaN(amount));

    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);
    const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;

    return {
      totalRecords: data.length,
      filteredRecords: 0, // Will be calculated by filteredData
      amountRange: [Math.max(0, minAmount), maxAmount],
      avgAmount: isNaN(avgAmount) ? 0 : avgAmount
    };
  }, [data]);

  // Apply filters to data
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    setIsLoading(true);

    let filtered = [...data];

    // Text search
    if (criteria.searchTerm.trim()) {
      const searchTerm = criteria.searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const searchableFields = [
          item.transactionId,
          item.notes,
          item.reference,
          item.customerName,
          item.locationName,
          item.teamName
        ];
        
        return searchableFields.some(field => 
          field && field.toString().toLowerCase().includes(searchTerm)
        );
      });
    }

    // Amount range filter
    filtered = filtered.filter(item => {
      const amount = parseFloat(item.grossSales || item.netSales || item.amount || 0);
      return amount >= criteria.amountRange[0] && amount <= criteria.amountRange[1];
    });

    // Team filter
    if (criteria.teamIds.length > 0) {
      filtered = filtered.filter(item => 
        criteria.teamIds.includes(item.teamId)
      );
    }

    // POS System filter
    if (criteria.posSystemIds.length > 0) {
      filtered = filtered.filter(item => 
        criteria.posSystemIds.includes(item.posSystemId)
      );
    }

    // Transaction type filter
    if (criteria.transactionTypes.length > 0) {
      filtered = filtered.filter(item => 
        criteria.transactionTypes.includes(item.transactionType || 'sale')
      );
    }

    // Location filter
    if (criteria.locations.length > 0) {
      filtered = filtered.filter(item => 
        criteria.locations.includes(item.locationId)
      );
    }

    // Date filter (if dateRange is provided)
    if (dateRange?.from || dateRange?.to) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        
        switch (criteria.dateOperator) {
          case 'between':
            return dateRange.from && dateRange.to
              ? itemDate >= dateRange.from && itemDate <= dateRange.to
              : true;
          case 'before':
            return dateRange.to ? itemDate <= dateRange.to : true;
          case 'after':
            return dateRange.from ? itemDate >= dateRange.from : true;
          case 'on':
            return dateRange.from 
              ? itemDate.toDateString() === dateRange.from.toDateString()
              : true;
          default:
            return true;
        }
      });
    }

    // Custom field filters
    Object.entries(criteria.customFields).forEach(([field, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        filtered = filtered.filter(item => {
          const itemValue = item[field];
          if (typeof value === 'string') {
            return itemValue && itemValue.toString().toLowerCase().includes(value.toLowerCase());
          }
          return itemValue === value;
        });
      }
    });

    setIsLoading(false);
    return filtered;
  }, [data, criteria, dateRange]);

  // Update filtered records count in stats
  const updatedStats = useMemo(() => ({
    ...dataStats,
    filteredRecords: filteredData.length
  }), [dataStats, filteredData.length]);

  // Call onDataChange when filtered data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(filteredData);
    }
  }, [filteredData, onDataChange]);

  // Update criteria
  const updateCriteria = (updates: Partial<FilterCriteria>) => {
    setCriteria(prev => ({ ...prev, ...updates }));
  };

  // Reset all criteria
  const resetCriteria = () => {
    setCriteria({
      searchTerm: '',
      amountRange: dataStats.amountRange,
      teamIds: [],
      posSystemIds: [],
      transactionTypes: [],
      locations: [],
      dateOperator: 'between',
      customFields: {}
    });
  };

  // Save current criteria as a filter
  const saveFilter = (name: string) => {
    const newFilter: SavedFilter = {
      id: `filter-${Date.now()}`,
      name,
      criteria: { ...criteria },
      createdAt: new Date(),
      usageCount: 0
    };

    const updatedFilters = [newFilter, ...savedFilters];
    setSavedFilters(updatedFilters);

    try {
      localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updatedFilters));
    } catch (error) {
      console.warn('Failed to save filter:', error);
    }

    return newFilter.id;
  };

  // Load a saved filter
  const loadFilter = (filter: SavedFilter) => {
    setCriteria(filter.criteria);
    
    // Increment usage count
    const updatedFilters = savedFilters.map(f => 
      f.id === filter.id ? { ...f, usageCount: f.usageCount + 1 } : f
    );
    setSavedFilters(updatedFilters);

    try {
      localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updatedFilters));
    } catch (error) {
      console.warn('Failed to update filter usage:', error);
    }
  };

  // Delete a saved filter
  const deleteFilter = (filterId: string) => {
    const updatedFilters = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(updatedFilters);

    try {
      localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updatedFilters));
    } catch (error) {
      console.warn('Failed to delete filter:', error);
    }
  };

  // Get available filter options from data
  const filterOptions = useMemo(() => {
    const teams = new Set<string>();
    const posSystems = new Set<string>();
    const locations = new Set<string>();
    const transactionTypes = new Set<string>();

    data.forEach(item => {
      if (item.teamId) teams.add(item.teamId);
      if (item.posSystemId) posSystems.add(item.posSystemId);
      if (item.locationId) locations.add(item.locationId);
      if (item.transactionType) transactionTypes.add(item.transactionType);
    });

    return {
      teams: Array.from(teams).map(id => ({ id, name: id })), // Would normally resolve names
      posSystems: Array.from(posSystems).map(id => ({ id, name: id })),
      locations: Array.from(locations).map(id => ({ id, name: id })),
      transactionTypes: Array.from(transactionTypes).map(id => ({ id, name: id }))
    };
  }, [data]);

  // Export filtered data
  const exportFilteredData = (format: 'csv' | 'json') => {
    if (filteredData.length === 0) {
      throw new Error('No data to export');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `filtered-data-${timestamp}.${format}`;

    if (format === 'csv') {
      // CSV export logic would go here
      console.log('Exporting CSV:', filename);
    } else {
      // JSON export logic would go here
      console.log('Exporting JSON:', filename);
    }
  };

  return {
    // Current state
    criteria,
    filteredData,
    dataStats: updatedStats,
    isLoading,
    savedFilters,
    filterOptions,

    // Actions
    updateCriteria,
    resetCriteria,
    saveFilter,
    loadFilter,
    deleteFilter,
    exportFilteredData,

    // Computed values
    hasActiveFilters: criteria.searchTerm.length > 0 || 
                     criteria.teamIds.length > 0 || 
                     criteria.posSystemIds.length > 0 || 
                     criteria.transactionTypes.length > 0 || 
                     criteria.locations.length > 0 ||
                     criteria.amountRange[0] > dataStats.amountRange[0] ||
                     criteria.amountRange[1] < dataStats.amountRange[1],
    
    filterCount: [
      criteria.searchTerm ? 1 : 0,
      criteria.teamIds.length > 0 ? 1 : 0,
      criteria.posSystemIds.length > 0 ? 1 : 0,
      criteria.transactionTypes.length > 0 ? 1 : 0,
      criteria.locations.length > 0 ? 1 : 0,
      (criteria.amountRange[0] > dataStats.amountRange[0] || 
       criteria.amountRange[1] < dataStats.amountRange[1]) ? 1 : 0
    ].reduce((sum, count) => sum + count, 0)
  };
};

export type { FilterCriteria, SavedFilter, FilterStats };