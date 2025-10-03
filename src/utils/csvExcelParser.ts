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
  // Look for Toast-specific headers
  const headerRow = rows.slice(0, 5).find(row => 
    row.some(cell => 
      cell.toLowerCase().includes('gross sales') ||
      cell.toLowerCase().includes('net sales') ||
      cell.toLowerCase().includes('total sales')
    )
  );
  
  return !!headerRow;
};

const parseToastFormat = (
  rows: string[][],
  teamId: string,
  fallbackDate: Date,
  fileName: string
): ParsedCSVExcelData => {
  try {
    const validationErrors: ValidationError[] = [];
    
    // Find date in first few rows
    let extractedDate: Date | undefined;
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const dateMatch = rows[i].join(' ').match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
      if (dateMatch) {
        const parsedDate = new Date(dateMatch[1]);
        if (!isNaN(parsedDate.getTime())) {
          extractedDate = parsedDate;
          break;
        }
      }
    }

    // Find header row
    const headerRowIndex = rows.findIndex(row => 
      row.some(cell => cell.toLowerCase().includes('gross sales'))
    );

    if (headerRowIndex === -1) {
      return { success: false, error: 'Could not find sales data headers' };
    }

    const headers = rows[headerRowIndex].map(h => h.toLowerCase());
    
    // Find key column indices
    const grossSalesIdx = headers.findIndex(h => h.includes('gross sales') || h.includes('total sales'));
    const netSalesIdx = headers.findIndex(h => h.includes('net sales'));
    const taxIdx = headers.findIndex(h => h.includes('tax'));
    const discountsIdx = headers.findIndex(h => h.includes('discount'));
    const tipsIdx = headers.findIndex(h => h.includes('tip') || h.includes('gratuity'));

    // Parse data rows (typically 1-2 rows after headers)
    const dataRowIndex = headerRowIndex + 1;
    if (dataRowIndex >= rows.length) {
      return { success: false, error: 'No data rows found after headers' };
    }

    const dataRow = rows[dataRowIndex];
    
    const parseAmount = (value: string): number => {
      const cleaned = value.replace(/[$,]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const grossSales = grossSalesIdx !== -1 ? parseAmount(dataRow[grossSalesIdx]) : 0;
    const netSales = netSalesIdx !== -1 ? parseAmount(dataRow[netSalesIdx]) : grossSales;
    const tax = taxIdx !== -1 ? parseAmount(dataRow[taxIdx]) : 0;
    const discounts = discountsIdx !== -1 ? parseAmount(dataRow[discountsIdx]) : 0;
    const tips = tipsIdx !== -1 ? parseAmount(dataRow[tipsIdx]) : 0;

    if (grossSales === 0) {
      validationErrors.push({
        field: 'grossSales',
        message: 'Gross sales is 0 or could not be parsed',
        severity: 'warning'
      });
    }

    const salesData: SalesData = {
      id: '',
      date: (extractedDate || fallbackDate).toISOString().split('T')[0],
      location: '',
      team_id: teamId,
      grossSales,
      netSales,
      orderCount: 0,
      orderAverage: grossSales > 0 ? netSales / Math.max(1, 0) : 0,
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
        nonCash: netSales,
        totalCash: 0,
        calculatedCash: 0,
        tips
      },
      destinations: [],
      revenueItems: [],
      tenders: [],
      discounts: discounts > 0 ? [{
        name: 'Discounts',
        quantity: 1,
        total: discounts,
        percent: grossSales > 0 ? (discounts / grossSales) * 100 : 0
      }] : [],
      promotions: [],
      taxes: tax > 0 ? [{
        name: 'Tax',
        quantity: 1,
        total: tax,
        percent: grossSales > 0 ? (tax / grossSales) * 100 : 0
      }] : [],
      voids: 0,
      refunds: 0
    };

    return {
      success: true,
      data: salesData,
      extractedDate,
      posSystem: 'toast',
      confidenceScore: 85,
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
