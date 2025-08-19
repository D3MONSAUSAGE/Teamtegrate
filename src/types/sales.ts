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
  fileName?: string;
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
}

export const sampleSalesData: SalesData[] = [
  {
    id: '1',
    date: '2025-02-23',
    location: 'Santa Clarita',
    fileName: 'santa-clarita-02-23-sales.pdf',
    grossSales: 9545.49,
    netSales: 8684.61,
    orderCount: 291,
    orderAverage: 29.84,
    labor: {
      cost: 1200.50,
      hours: 45.5,
      percentage: 12.5,
      salesPerLaborHour: 209.9
    },
    cashManagement: {
      depositsAccepted: 500.00,
      depositsRedeemed: 450.00,
      paidIn: 100.00,
      paidOut: 75.00
    },
    giftCards: {
      issueAmount: 250.00,
      issueCount: 5,
      reloadAmount: 100.00,
      reloadCount: 2
    },
    paymentBreakdown: {
      nonCash: 7200.00,
      totalCash: 1484.61,
      calculatedCash: 1484.61,
      tips: 123.28
    },
    destinations: [
      { name: 'Drive Thru', quantity: 257, total: 7642.24, percent: 88.00 },
      { name: 'DoorDash', quantity: 17, total: 590.25, percent: 6.80 },
      { name: 'Online Ordering', quantity: 5, total: 210.20, percent: 2.42 },
      { name: 'Dine In', quantity: 7, total: 129.59, percent: 1.49 },
      { name: 'KIOSK- Dine In', quantity: 4, total: 95.88, percent: 1.10 },
      { name: 'KIOSK- Take Out', quantity: 1, total: 16.45, percent: 0.19 }
    ],
    revenueItems: [
      { name: 'COMBO', quantity: 111, total: 1675.84, percent: 19.30 },
      { name: 'TACOS', quantity: 360, total: 1192.05, percent: 13.73 },
      { name: 'RED TACOS', quantity: 175, total: 868.72, percent: 10.00 },
      { name: 'FRIES GUANATOS', quantity: 67, total: 786.57, percent: 9.06 },
      { name: 'GUANATOS TACOS', quantity: 127, total: 643.89, percent: 7.41 },
      { name: 'DRINKS', quantity: 193, total: 616.70, percent: 7.10 }
    ],
    tenders: [
      { name: 'Visa', quantity: 136, payments: 4273.02, tips: 91.30, total: 4364.32, percent: 45.24 },
      { name: 'Cash', quantity: 62, payments: 1471.74, tips: 0.00, total: 1471.74, percent: 15.26 },
      { name: 'MasterCard', quantity: 40, payments: 1417.79, tips: 31.98, total: 1449.77, percent: 15.03 },
      { name: 'UberEats', quantity: 22, payments: 700.34, tips: 0.00, total: 700.34, percent: 7.26 },
      { name: 'EXT DoorDash', quantity: 17, payments: 646.32, tips: 0.00, total: 646.32, percent: 6.70 }
    ],
    discounts: [
      { name: '% Discount', quantity: 1, total: 11.95, percent: 38.74 },
      { name: '$ Discount', quantity: 1, total: 10.00, percent: 32.41 },
      { name: 'Employee 30%', quantity: 2, total: 6.26, percent: 20.29 },
      { name: 'Employee 10%', quantity: 1, total: 2.64, percent: 8.56 }
    ],
    promotions: [
      { name: '$5 OFF over $30', quantity: 1, total: 5.00, percent: 100.00 }
    ],
    taxes: [
      { name: 'Sales Tax', quantity: 1379, total: 825.03, percent: 100.00 }
    ],
    voids: 25.50,
    refunds: 15.75,
    surcharges: 45.20,
    expenses: 125.00
  }
];
