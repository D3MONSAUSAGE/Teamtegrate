export interface InventoryCategory {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryUnit {
  id: string;
  organization_id: string;
  name: string;
  abbreviation: string;
  unit_type: 'weight' | 'volume' | 'count' | 'length' | 'area';
  measurement_type?: string; // What each individual unit is (bottles, bags, pieces, pounds, etc.)
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  category_id?: string;
  base_unit_id?: string;
  purchase_unit?: string;
  conversion_factor?: number;
  purchase_price?: number;
  calculated_unit_price?: number;
  current_stock: number;
  minimum_threshold?: number;
  maximum_threshold?: number;
  reorder_point?: number;
  unit_cost?: number;
  supplier_info?: Record<string, any>;
  barcode?: string;
  sku?: string;
  location?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_template: boolean;
  template_name?: string;
  expected_cost?: number;
  sort_order: number;
  // Relations
  category?: InventoryCategory;
  base_unit?: InventoryUnit;
}

export interface InventoryTransaction {
  id: string;
  organization_id: string;
  item_id: string;
  transaction_type: 'in' | 'out' | 'adjustment' | 'count';
  quantity: number;
  unit_cost?: number;
  reference_number?: string;
  notes?: string;
  user_id: string;
  transaction_date: string;
  created_at: string;
}

export interface InventoryCount {
  id: string;
  organization_id: string;
  count_date: string;
  status: 'in_progress' | 'completed';
  conducted_by: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // New team-based fields
  team_id?: string;
  template_id?: string;
  assigned_to?: string;
  completion_percentage: number;
  variance_count: number;
  total_items_count: number;
}

export interface InventoryCountItem {
  id: string;
  count_id: string;
  item_id: string;
  expected_quantity: number;
  actual_quantity?: number;
  variance?: number;
  notes?: string;
  counted_by?: string;
  counted_at?: string;
  item?: InventoryItem;
}

export interface InventoryAlert {
  id: string;
  organization_id: string;
  item_id: string;
  alert_type: 'low_stock' | 'overstock' | 'expired';
  threshold_value?: number;
  current_value?: number;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  item?: InventoryItem;
}

// New team-based interfaces
export interface InventoryTemplate {
  id: string;
  organization_id: string;
  team_id?: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  execution_frequency: 'manual' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  execution_days: string[];
  execution_time_start?: string;
  execution_time_due?: string;
  auto_assign_enabled: boolean;
  notification_settings: Record<string, any>;
  execution_window_hours: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
}

export interface InventoryTemplateItem {
  id: string;
  template_id: string;
  item_id: string;
  expected_quantity: number;
  minimum_quantity?: number;
  maximum_quantity?: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  item?: InventoryItem;
}

export interface TeamInventoryAssignment {
  id: string;
  organization_id: string;
  team_id: string;
  template_id: string;
  assigned_by: string;
  is_active: boolean;
  schedule_days: string[];
  due_time: string;
  created_at: string;
  updated_at: string;
  template?: InventoryTemplate;
}

export interface InventoryContextType {
  // Data
  items: InventoryItem[];
  transactions: InventoryTransaction[];
  counts: InventoryCount[];
  alerts: InventoryAlert[];
  categories: InventoryCategory[];
  units: InventoryUnit[];
  
  // Team-based data
  templates: InventoryTemplate[];
  templateItems: InventoryTemplateItem[];
  teamAssignments: TeamInventoryAssignment[];
  
  // Loading states
  loading: boolean;
  itemsLoading: boolean;
  transactionsLoading: boolean;
  countsLoading: boolean;
  alertsLoading: boolean;
  templatesLoading: boolean;
  categoriesLoading: boolean;
  unitsLoading: boolean;
  
  // Operations
  createItem: (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'category' | 'base_unit' | 'calculated_unit_price' | 'organization_id' | 'created_by'>) => Promise<InventoryItem>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<InventoryItem>;
  getItemById: (id: string) => Promise<InventoryItem | null>;
  deleteItem: (id: string) => Promise<void>;
  updateStock: (id: string, newStock: number) => Promise<void>;
  
  createTransaction: (transaction: Omit<InventoryTransaction, 'id' | 'created_at'>) => Promise<InventoryTransaction>;
  
  startInventoryCount: (notes?: string, teamId?: string, templateId?: string) => Promise<InventoryCount>;
  updateCountItem: (countId: string, itemId: string, actualQuantity: number, notes?: string) => Promise<void>;
  completeInventoryCount: (countId: string) => Promise<void>;
  
  resolveAlert: (alertId: string) => Promise<void>;
  
  // Categories operations
  createCategory: (category: Omit<InventoryCategory, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) => Promise<InventoryCategory>;
  updateCategory: (id: string, updates: Partial<InventoryCategory>) => Promise<InventoryCategory>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Units operations
  createUnit: (unit: Omit<InventoryUnit, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) => Promise<InventoryUnit>;
  updateUnit: (id: string, updates: Partial<InventoryUnit>) => Promise<InventoryUnit>;
  deleteUnit: (id: string) => Promise<void>;
  
  // Template operations
  createTemplate: (template: Omit<InventoryTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<InventoryTemplate>;
  updateTemplate: (id: string, updates: Partial<InventoryTemplate>) => Promise<InventoryTemplate>;
  getTemplateItems: (templateId: string) => Promise<InventoryTemplateItem[]>;
  addItemToTemplate: (templateId: string, itemId: string, expectedQuantity?: number, minimumQuantity?: number, maximumQuantity?: number, sortOrder?: number) => Promise<InventoryTemplateItem>;
  removeItemFromTemplate: (templateId: string, itemId: string) => Promise<void>;
  duplicateTemplate: (templateId: string, newName?: string) => Promise<InventoryTemplate>;
  assignTemplateToTeam: (templateId: string, teamId: string) => Promise<TeamInventoryAssignment>;
  getTeamAssignments: () => TeamInventoryAssignment[];
  getTeamInventories: (teamId: string) => TeamInventoryAssignment[];
  initializeCountItems: (countId: string, templateId?: string) => Promise<void>;
  repairCountExpectedQuantities: (countId: string) => Promise<void>;
  
  // Refresh functions
  refreshItems: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshCounts: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  refreshTemplates: () => Promise<void>;
  refreshTeamAssignments: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshUnits: () => Promise<void>;
  refreshTemplateItems: () => Promise<void>;
  refreshData: () => Promise<void>;
}