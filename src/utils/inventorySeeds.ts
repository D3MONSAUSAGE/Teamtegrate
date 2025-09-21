import { InventoryCategory, InventoryUnit } from '@/contexts/inventory/types';

export const DEFAULT_CATEGORIES = [
  {
    name: 'Food & Beverage',
    description: 'All food and beverage items including ingredients, prepared foods, and drinks',
  },
  {
    name: 'Supplies',
    description: 'General supplies including packaging, cleaning supplies, and office materials',
  },
  {
    name: 'Equipment',
    description: 'Kitchen equipment, tools, and machinery',
  },
  {
    name: 'Other',
    description: 'Miscellaneous items that don\'t fit other categories',
  },
];

export const DEFAULT_UNITS = [
  {
    name: 'Each',
    abbreviation: 'ea',
    unit_type: 'count' as const,
  },
  {
    name: 'Pounds',
    abbreviation: 'lbs',
    unit_type: 'weight' as const,
  },
  {
    name: 'Ounces',
    abbreviation: 'oz',
    unit_type: 'weight' as const,
  },
  {
    name: 'Gallons',
    abbreviation: 'gal',
    unit_type: 'volume' as const,
  },
  {
    name: 'Liters',
    abbreviation: 'L',
    unit_type: 'volume' as const,
  },
  {
    name: 'Cases',
    abbreviation: 'cs',
    unit_type: 'count' as const,
  },
  {
    name: 'Boxes',
    abbreviation: 'bx',
    unit_type: 'count' as const,
  },
];

export const shouldSeedDefaults = (categories: InventoryCategory[], units: InventoryUnit[]) => {
  return categories.length === 0 || units.length === 0;
};