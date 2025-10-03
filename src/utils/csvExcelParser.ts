import { SalesData } from '@/types/sales';
import { read, utils } from 'xlsx';

interface ValidationError {
  field: string;
  message: string;
  severity: 'warning' | 'error';
}

export interface ParsedCSVExcelData {
  success: boolean;
  data?: SalesData;
  error?: string;
  extractedDate?: Date;
  posSystem?: string;
  confidenceScore?: number;
  validationErrors?: ValidationError[];
}

export const parseCSVExcel = async (
  file: File,
  teamId: string,
  fallbackDate: Date
): Promise<ParsedCSVExcelData> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = read(arrayBuffer, { type: 'array' });
    
    // Get the first sheet
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = utils.sheet_to_json(firstSheet, { header: 1, raw: false });
    
    if (rows.length === 0) {
      return { success: false, error: 'Empty file' };
    }

    // Detect format and extract data
    const result = detectAndParse(rows, teamId, fallbackDate, file.name);
    
    return result;
  } catch (error) {
    console.error('CSV/Excel parse error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to parse file' 
    };
  }
};

const detectAndParse = (
  rows: any[][],
  teamId: string,
  fallbackDate: Date,
  fileName: string
): ParsedCSVExcelData => {
  // Convert all cells to strings for easier matching
  const stringRows = rows.map(row => 
    row.map(cell => String(cell || '').trim())
  );

  // Detect Toast POS format
  if (isToastFormat(stringRows)) {
    return parseToastFormat(stringRows, teamId, fallbackDate, fileName);
  }

  // Detect generic sales format
  if (isGenericSalesFormat(stringRows)) {
    return parseGenericFormat(stringRows, teamId, fallbackDate, fileName);
  }

  return {
    success: false,
    error: 'Unrecognized CSV/Excel format. Please ensure the file contains sales data with columns like Date, Gross Sales, Net Sales, etc.'
  };
};

const isToastFormat = (rows: string[][]): boolean => {
  // Check for Toast signature patterns - section-based format
  const hasSalesSummaryHeader = rows.length > 0 && 
    rows[0].some(cell => cell.includes('SalesSummary'));
  
  const hasRevenueSummary = rows.some(row => 
    row.some(cell => cell.toLowerCase() === 'revenue summary')
  );
  
  const hasNetSalesSummary = rows.some(row => 
    row.some(cell => cell.toLowerCase() === 'net sales summary')
  );
  
  const hasPaymentsSummary = rows.some(row =>
    row.some(cell => cell.toLowerCase() === 'payments summary')
  );
  
  return hasSalesSummaryHeader || hasRevenueSummary || hasNetSalesSummary || hasPaymentsSummary;
};

// Helper functions for section-based parsing
const findSection = (rows: string[][], sectionName: string): number => {
  return rows.findIndex(row => 
    row.some(cell => cell.toLowerCase() === sectionName.toLowerCase())
  );
};

const extractLabelValue = (rows: string[][], startIdx: number, label: string): string | null => {
  for (let i = startIdx; i < Math.min(startIdx + 30, rows.length); i++) {
    const row = rows[i];
    const labelIdx = row.findIndex(cell => 
      cell.toLowerCase() === label.toLowerCase()
    );
    if (labelIdx !== -1) {
      // Look for value in next column
      if (labelIdx + 1 < row.length && row[labelIdx + 1]) {
        return row[labelIdx + 1];
      }
    }
  }
  return null;
};

const parseCurrency = (value: string | null): number => {
  if (!value) return 0;
  const cleaned = value.replace(/[$,]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const parseInteger = (value: string | null): number => {
  if (!value) return 0;
  const parsed = parseInt(value.replace(/,/g, ''), 10);
  return isNaN(parsed) ? 0 : parsed;
};

const parseTableSection = (
  rows: string[][],
  startIdx: number
): { headers: string[], data: string[][] } => {
  // Find header row (first non-empty row with multiple columns after section title)
  let headerIdx = startIdx + 1;
  while (headerIdx < rows.length && rows[headerIdx].filter(c => c).length < 2) {
    headerIdx++;
  }
  
  if (headerIdx >= rows.length) {
    return { headers: [], data: [] };
  }
  
  const headers = rows[headerIdx];
  const data: string[][] = [];
  
  // Parse data rows until we hit empty row or next section
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    // Stop if we hit an empty row or another section header
    if (row.every(cell => !cell) || (row.some(cell => cell.toLowerCase().includes('summary')) && row.filter(c => c).length < 3)) {
      break;
    }
    if (row.some(cell => cell)) {
      data.push(row);
    }
  }
  
  return { headers, data };
};

const parseToastFormat = (
  rows: string[][],
  teamId: string,
  fallbackDate: Date,
  fileName: string
): ParsedCSVExcelData => {
  try {
    const validationErrors: ValidationError[] = [];
    let sectionsFound = 0;
    
    // Extract date from first row: "SalesSummary_2025-10-01_2025-10-01"
    let extractedDate: Date | undefined;
    if (rows.length > 0 && rows[0][0]) {
      const dateMatch = rows[0][0].match(/SalesSummary_(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        extractedDate = new Date(dateMatch[1]);
        if (isNaN(extractedDate.getTime())) {
          extractedDate = undefined;
        }
      }
    }
    
    // Extract location from second row: "-Palmdale-Guanatos Tacos & Bar"
    let location = '';
    if (rows.length > 1 && rows[1][0]) {
      location = rows[1][0].replace(/^-+/, '').trim();
    }
    
    // Find sections
    const revenueSummaryIdx = findSection(rows, 'revenue summary');
    const netSalesSummaryIdx = findSection(rows, 'net sales summary');
    const serviceModeIdx = findSection(rows, 'service mode summary');
    const paymentsSummaryIdx = findSection(rows, 'payments summary');
    const voidSummaryIdx = findSection(rows, 'void summary');
    const cashActivityIdx = findSection(rows, 'cash activity');
    const discountSummaryIdx = findSection(rows, 'check discounts');
    const taxSummaryIdx = findSection(rows, 'tax summary');
    
    // Extract data from Revenue summary
    let netSales = 0;
    let taxAmount = 0;
    let tips = 0;
    let gratuity = 0;
    
    if (revenueSummaryIdx !== -1) {
      sectionsFound++;
      netSales = parseCurrency(extractLabelValue(rows, revenueSummaryIdx, 'net sales'));
      taxAmount = parseCurrency(extractLabelValue(rows, revenueSummaryIdx, 'tax amount'));
      tips = parseCurrency(extractLabelValue(rows, revenueSummaryIdx, 'tips'));
      gratuity = parseCurrency(extractLabelValue(rows, revenueSummaryIdx, 'gratuity'));
    }
    
    // Extract data from Net sales summary
    let grossSales = 0;
    let salesDiscounts = 0;
    let salesRefunds = 0;
    
    if (netSalesSummaryIdx !== -1) {
      sectionsFound++;
      grossSales = parseCurrency(extractLabelValue(rows, netSalesSummaryIdx, 'gross sales'));
      salesDiscounts = parseCurrency(extractLabelValue(rows, netSalesSummaryIdx, 'sales discounts'));
      salesRefunds = parseCurrency(extractLabelValue(rows, netSalesSummaryIdx, 'sales refunds'));
    }
    
    // Extract data from Service mode summary table
    let orderCount = 0;
    let orderAverage = 0;
    
    if (serviceModeIdx !== -1) {
      sectionsFound++;
      const serviceTable = parseTableSection(rows, serviceModeIdx);
      if (serviceTable.headers.length > 0) {
        // Find "Total" row and extract data
        const totalRow = serviceTable.data.find(row => 
          row[0] && row[0].toLowerCase() === 'total'
        );
        if (totalRow) {
          // Find column indices
          const ordersColIdx = serviceTable.headers.findIndex(h => 
            h.toLowerCase().includes('orders')
          );
          const avgPaymentColIdx = serviceTable.headers.findIndex(h => 
            h.toLowerCase().includes('avg') && h.toLowerCase().includes('payment')
          );
          
          if (ordersColIdx !== -1) {
            orderCount = parseInteger(totalRow[ordersColIdx]);
          }
          if (avgPaymentColIdx !== -1) {
            orderAverage = parseCurrency(totalRow[avgPaymentColIdx]);
          }
        }
      }
    }
    
    // Extract data from Payments summary table
    const tenders: any[] = [];
    let totalCash = 0;
    let nonCash = 0;
    
    if (paymentsSummaryIdx !== -1) {
      sectionsFound++;
      const paymentsTable = parseTableSection(rows, paymentsSummaryIdx);
      if (paymentsTable.headers.length > 0) {
        // Find column indices
        const typeIdx = paymentsTable.headers.findIndex(h => 
          h.toLowerCase().includes('payment type')
        );
        const countIdx = paymentsTable.headers.findIndex(h => 
          h.toLowerCase() === 'count'
        );
        const amountIdx = paymentsTable.headers.findIndex(h => 
          h.toLowerCase() === 'amount'
        );
        const tipsIdx = paymentsTable.headers.findIndex(h => 
          h.toLowerCase() === 'tips'
        );
        const totalIdx = paymentsTable.headers.findIndex(h => 
          h.toLowerCase() === 'total'
        );
        
        // Parse payment rows
        for (const row of paymentsTable.data) {
          if (!row[typeIdx] || row[typeIdx].toLowerCase() === 'total') continue;
          
          const paymentType = row[typeIdx];
          const count = countIdx !== -1 ? parseInteger(row[countIdx]) : 0;
          const amount = amountIdx !== -1 ? parseCurrency(row[amountIdx]) : 0;
          const paymentTips = tipsIdx !== -1 ? parseCurrency(row[tipsIdx]) : 0;
          const total = totalIdx !== -1 ? parseCurrency(row[totalIdx]) : 0;
          
          tenders.push({
            name: paymentType,
            quantity: count,
            payments: amount,
            tips: paymentTips,
            total: total,
            percent: grossSales > 0 ? (total / grossSales) * 100 : 0
          });
          
          // Categorize cash vs non-cash
          if (paymentType.toLowerCase().includes('cash')) {
            totalCash += total;
          } else {
            nonCash += total;
          }
        }
      }
    }
    
    // Extract void data
    let voids = 0;
    if (voidSummaryIdx !== -1) {
      sectionsFound++;
      voids = parseCurrency(extractLabelValue(rows, voidSummaryIdx, 'void amount'));
    }
    
    // Extract discounts
    const discounts: any[] = [];
    if (salesDiscounts > 0) {
      discounts.push({
        name: 'Sales discounts',
        quantity: 1,
        total: Math.abs(salesDiscounts),
        percent: grossSales > 0 ? (Math.abs(salesDiscounts) / grossSales) * 100 : 0
      });
    }
    
    // Parse detailed discounts if available
    if (discountSummaryIdx !== -1) {
      sectionsFound++;
      const discountTable = parseTableSection(rows, discountSummaryIdx);
      if (discountTable.headers.length > 0) {
        const nameIdx = discountTable.headers.findIndex(h => 
          h.toLowerCase().includes('discount')
        );
        const countIdx = discountTable.headers.findIndex(h => 
          h.toLowerCase() === 'count'
        );
        const amountIdx = discountTable.headers.findIndex(h => 
          h.toLowerCase().includes('amount')
        );
        
        for (const row of discountTable.data) {
          if (!row[nameIdx] || row[nameIdx].toLowerCase() === 'total') continue;
          
          const name = row[nameIdx];
          const count = countIdx !== -1 ? parseInteger(row[countIdx]) : 0;
          const amount = amountIdx !== -1 ? parseCurrency(row[amountIdx]) : 0;
          
          // Only add if not already added as "Sales discounts"
          if (amount > 0 && name.toLowerCase() !== 'sales discounts') {
            discounts.push({
              name,
              quantity: count,
              total: amount,
              percent: grossSales > 0 ? (amount / grossSales) * 100 : 0
            });
          }
        }
      }
    }
    
    // Extract taxes
    const taxes: any[] = [];
    if (taxAmount > 0) {
      taxes.push({
        name: 'Tax',
        quantity: 1,
        total: taxAmount,
        percent: grossSales > 0 ? (taxAmount / grossSales) * 100 : 0
      });
    }
    
    // Parse detailed taxes if available
    if (taxSummaryIdx !== -1) {
      sectionsFound++;
      const taxTable = parseTableSection(rows, taxSummaryIdx);
      if (taxTable.headers.length > 0) {
        const rateIdx = taxTable.headers.findIndex(h => 
          h.toLowerCase().includes('tax rate')
        );
        const amountIdx = taxTable.headers.findIndex(h => 
          h.toLowerCase().includes('tax amount')
        );
        
        for (const row of taxTable.data) {
          if (!row[rateIdx]) continue;
          
          const name = row[rateIdx];
          const amount = amountIdx !== -1 ? parseCurrency(row[amountIdx]) : 0;
          
          if (amount > 0 && name.toLowerCase() !== 'tax') {
            taxes.push({
              name,
              quantity: 1,
              total: amount,
              percent: grossSales > 0 ? (amount / grossSales) * 100 : 0
            });
          }
        }
      }
    }
    
    // Validation
    if (grossSales === 0) {
      validationErrors.push({
        field: 'grossSales',
        message: 'Gross sales is 0 or could not be parsed',
        severity: 'error'
      });
    }
    
    if (sectionsFound < 3) {
      validationErrors.push({
        field: 'format',
        message: `Only found ${sectionsFound} sections. Some data may be missing.`,
        severity: 'warning'
      });
    }
    
    // Calculate confidence score
    const confidenceScore = Math.min(100, 50 + (sectionsFound * 8));
    
    const salesData: SalesData = {
      id: '',
      date: (extractedDate || fallbackDate).toISOString().split('T')[0],
      location: location || 'Unknown Location',
      team_id: teamId,
      grossSales,
      netSales,
      orderCount,
      orderAverage,
      labor: {
        cost: 0,
        hours: 0,
        percentage: 0,
        salesPerLaborHour: 0
      },
      cashManagement: {
        depositsAccepted: 0,
        depositsRedeemed: 0,
        paidIn: 0,
        paidOut: 0
      },
      giftCards: {
        issueAmount: 0,
        issueCount: 0,
        reloadAmount: 0,
        reloadCount: 0
      },
      paymentBreakdown: {
        totalCash,
        nonCash,
        calculatedCash: totalCash - tips,
        tips
      },
      destinations: [],
      revenueItems: [],
      tenders,
      discounts,
      promotions: [],
      taxes,
      voids,
      refunds: Math.abs(salesRefunds)
    };

    return {
      success: true,
      data: salesData,
      extractedDate,
      posSystem: 'toast',
      confidenceScore,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined
    };
  } catch (error) {
    console.error('Toast CSV parse error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse Toast CSV'
    };
  }
};

const isGenericSalesFormat = (rows: string[][]): boolean => {
  // Check if any row has sales-related columns
  return rows.some(row => 
    row.some(cell => {
      const lower = cell.toLowerCase();
      return lower.includes('sales') || 
             lower.includes('revenue') || 
             lower.includes('total') ||
             lower.includes('amount');
    })
  );
};

const parseGenericFormat = (
  rows: string[][],
  teamId: string,
  fallbackDate: Date,
  fileName: string
): ParsedCSVExcelData => {
  try {
    const validationErrors: ValidationError[] = [];

    // Find date
    let extractedDate: Date | undefined;
    for (const row of rows.slice(0, 10)) {
      for (const cell of row) {
        const dateMatch = cell.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
        if (dateMatch) {
          const parsedDate = new Date(dateMatch[1]);
          if (!isNaN(parsedDate.getTime())) {
            extractedDate = parsedDate;
            break;
          }
        }
      }
      if (extractedDate) break;
    }

    // Find header row
    const headerRowIndex = rows.findIndex(row => 
      row.some(cell => {
        const lower = cell.toLowerCase();
        return lower.includes('sales') || lower.includes('total') || lower.includes('revenue');
      })
    );

    if (headerRowIndex === -1) {
      return { success: false, error: 'Could not find sales data in file' };
    }

    const headers = rows[headerRowIndex].map(h => h.toLowerCase());
    const dataRowIndex = headerRowIndex + 1;

    if (dataRowIndex >= rows.length) {
      return { success: false, error: 'No data rows found' };
    }

    const dataRow = rows[dataRowIndex];

    const parseAmount = (value: string): number => {
      const cleaned = value.replace(/[$,]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Try to find sales amount in various ways
    let grossSales = 0;
    
    // Method 1: Look for specific column names
    const salesIdx = headers.findIndex(h => 
      h.includes('gross sales') || 
      h.includes('total sales') || 
      h.includes('sales') ||
      h.includes('revenue')
    );
    
    if (salesIdx !== -1) {
      grossSales = parseAmount(dataRow[salesIdx]);
    } else {
      // Method 2: Look for largest numeric value
      const amounts = dataRow.map(cell => parseAmount(cell)).filter(n => n > 0);
      grossSales = Math.max(...amounts, 0);
    }

    if (grossSales === 0) {
      validationErrors.push({
        field: 'grossSales',
        message: 'Could not extract valid sales amount',
        severity: 'warning'
      });
    }

    const salesData: SalesData = {
      id: '',
      date: (extractedDate || fallbackDate).toISOString().split('T')[0],
      location: '',
      team_id: teamId,
      grossSales,
      netSales: grossSales,
      orderCount: 0,
      orderAverage: 0,
      labor: {
        cost: 0,
        hours: 0,
        percentage: 0,
        salesPerLaborHour: 0
      },
      cashManagement: {
        depositsAccepted: 0,
        depositsRedeemed: 0,
        paidIn: 0,
        paidOut: 0
      },
      giftCards: {
        issueAmount: 0,
        issueCount: 0,
        reloadAmount: 0,
        reloadCount: 0
      },
      paymentBreakdown: {
        nonCash: grossSales,
        totalCash: 0,
        calculatedCash: 0,
        tips: 0
      },
      destinations: [],
      revenueItems: [],
      tenders: [],
      discounts: [],
      promotions: [],
      taxes: [],
      voids: 0,
      refunds: 0
    };

    return {
      success: true,
      data: salesData,
      extractedDate,
      posSystem: 'generic',
      confidenceScore: 60,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined
    };
  } catch (error) {
    console.error('Generic CSV parse error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse CSV/Excel'
    };
  }
};
