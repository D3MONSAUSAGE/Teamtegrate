export interface SalesChannel {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  commission_rate: number; // 0.15 for 15%
  commission_type: 'percentage' | 'flat_fee';
  flat_fee_amount?: number;
  is_active: boolean;
  team_id?: string;
  location?: string; // Deprecated, use team_id
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface SalesChannelTransaction {
  id: string;
  organization_id: string;
  sales_data_id: string;
  channel_id: string;
  team_id?: string;
  location?: string; // Deprecated, use team_id
  date: string;
  gross_sales: number;
  commission_fee: number;
  net_sales: number;
  order_count: number;
  created_at: string;
  updated_at: string;
  channel?: SalesChannel; // Optional populated channel data
}

export interface CreateSalesChannelData {
  name: string;
  description?: string;
  commission_rate: number;
  commission_type: 'percentage' | 'flat_fee';
  flat_fee_amount?: number;
  team_id?: string;
}

export interface SalesChannelSummary {
  channel_id: string;
  channel_name: string;
  total_gross_sales: number;
  total_commission_fees: number;
  total_net_sales: number;
  total_orders: number;
  commission_rate: number;
}