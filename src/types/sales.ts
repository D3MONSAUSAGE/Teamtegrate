export interface LaborData {
  cost: number;
  hours: number;
  percentage: number;
  salesPerLaborHour: number;
}

export interface CashManagementData {
  depositsAccepted: number;
  depositsRedeemed: number;
  paidIn: number;
  paidOut: number;
}

export interface GiftCardData {
  issueAmount: number;
  issueCount: number;
  reloadAmount: number;
  reloadCount: number;
}

export interface PaymentBreakdown {
  nonCash: number;
  totalCash: number;
  calculatedCash: number;
  tips: number;
}

export interface SalesData {
  id: string;
  date: string;
  location: string;
  team_id?: string;
  grossSales: number;
  netSales: number;
  orderCount: number;
  orderAverage: number;
  // Labor information
  labor: LaborData;
  // Cash management
  cashManagement: CashManagementData;
  // Gift cards
  giftCards: GiftCardData;
  // Payment breakdown
  paymentBreakdown: PaymentBreakdown;
  // Existing data structures
  destinations: {
    name: string;
    quantity: number;
    total: number;
    percent: number;
  }[];
  revenueItems: {
    name: string;
    quantity: number;
    total: number;
    percent: number;
  }[];
  tenders: {
    name: string;
    quantity: number;
    payments: number;
    tips: number;
    total: number;
    percent: number;
  }[];
  discounts: {
    name: string;
    quantity: number;
    total: number;
    percent: number;
  }[];
  promotions: {
    name: string;
    quantity: number;
    total: number;
    percent: number;
  }[];
  taxes: {
    name: string;
    quantity: number;
    total: number;
    percent: number;
  }[];
  // Additional financial data
  voids?: number;
  refunds?: number;
  surcharges?: number;
  expenses?: number;
}

export interface WeeklySalesData {
  weekStart: Date;
  weekEnd: Date;
  location: string;
  dailySales: SalesData[];
  totals: {
    nonCash: number;
    totalCash: number;
    grossTotal: number;
    discount: number;
    taxPaid: number;
    tips: number;
    netSales: number;
    calculatedCash: number;
    expenses: number;
    totalInHouseCash: number;
  };
}

export interface ParsedSalesData extends Omit<SalesData, 'date'> {
  date: Date;
  team_id?: string;
}

// Removed sample data - now using real data from Supabase
