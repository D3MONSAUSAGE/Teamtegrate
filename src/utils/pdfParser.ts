
import { SalesData, LaborData, CashManagementData, GiftCardData, PaymentBreakdown } from '@/types/sales';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

export interface ParsedPDFData {
  success: boolean;
  data?: SalesData;
  error?: string;
}

// Excel parsing function
export const parseExcelReport = async (file: File, location: string, date: Date): Promise<ParsedPDFData> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Extract values from specific cells based on the POS report format
        const grossSales = parseFloat(XLSX.utils.format_cell(worksheet['B4']) || '0');
        const netSales = parseFloat(XLSX.utils.format_cell(worksheet['B5']) || '0');
        const orderCount = parseInt(XLSX.utils.format_cell(worksheet['B6']) || '0');
        const orderAverage = parseFloat(XLSX.utils.format_cell(worksheet['B7']) || '0');
        
        const mockData: SalesData = {
          id: uuidv4(),
          date: format(date, 'yyyy-MM-dd'),
          location: location,
          fileName: file.name,
          grossSales,
          netSales,
          orderCount,
          orderAverage,
          labor: {
            cost: parseFloat(XLSX.utils.format_cell(worksheet['B20']) || '0'),
            hours: parseFloat(XLSX.utils.format_cell(worksheet['B21']) || '0'),
            percentage: parseFloat(XLSX.utils.format_cell(worksheet['B22']) || '0'),
            salesPerLaborHour: parseFloat(XLSX.utils.format_cell(worksheet['B23']) || '0')
          },
          cashManagement: {
            depositsAccepted: parseFloat(XLSX.utils.format_cell(worksheet['B30']) || '0'),
            depositsRedeemed: parseFloat(XLSX.utils.format_cell(worksheet['B31']) || '0'),
            paidIn: parseFloat(XLSX.utils.format_cell(worksheet['B32']) || '0'),
            paidOut: parseFloat(XLSX.utils.format_cell(worksheet['B33']) || '0')
          },
          giftCards: {
            issueAmount: parseFloat(XLSX.utils.format_cell(worksheet['B35']) || '0'),
            issueCount: parseInt(XLSX.utils.format_cell(worksheet['B36']) || '0'),
            reloadAmount: parseFloat(XLSX.utils.format_cell(worksheet['B37']) || '0'),
            reloadCount: parseInt(XLSX.utils.format_cell(worksheet['B38']) || '0')
          },
          paymentBreakdown: {
            nonCash: parseFloat(XLSX.utils.format_cell(worksheet['B40']) || '0'),
            totalCash: parseFloat(XLSX.utils.format_cell(worksheet['B41']) || '0'),
            calculatedCash: parseFloat(XLSX.utils.format_cell(worksheet['B42']) || '0'),
            tips: parseFloat(XLSX.utils.format_cell(worksheet['B43']) || '0')
          },
          destinations: [],
          revenueItems: [],
          tenders: [],
          discounts: [],
          promotions: [],
          taxes: [],
          voids: parseFloat(XLSX.utils.format_cell(worksheet['B50']) || '0'),
          refunds: parseFloat(XLSX.utils.format_cell(worksheet['B51']) || '0'),
          surcharges: parseFloat(XLSX.utils.format_cell(worksheet['B52']) || '0'),
          expenses: parseFloat(XLSX.utils.format_cell(worksheet['B53']) || '0')
        };

        resolve({ success: true, data: mockData });
      } catch (error) {
        resolve({ 
          success: false, 
          error: `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}` 
        });
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

// Mock PDF parser - in production, you'd use a library like pdf-parse or pdf2pic
export const parseBrinkPOSReport = async (file: File, location: string, date: Date): Promise<ParsedPDFData> => {
  // Route to appropriate parser based on file type
  if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
      file.name.endsWith('.xlsx')) {
    return parseExcelReport(file, location, date);
  }
  try {
    // Simulate PDF processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real implementation, you would:
    // 1. Extract text from PDF using a library like pdf-parse
    // 2. Use regex patterns to extract specific data points
    // 3. Parse the structured data into our SalesData format
    
    // For now, we'll return mock data based on typical Brink POS report structure
    const mockSalesData: SalesData = {
      id: uuidv4(),
      date: date.toISOString().split('T')[0],
      location: location,
      fileName: file.name,
      grossSales: 8500 + Math.random() * 2000,
      netSales: 7800 + Math.random() * 1500,
      orderCount: 250 + Math.floor(Math.random() * 100),
      orderAverage: 30 + Math.random() * 10,
      
      labor: {
        cost: 1100 + Math.random() * 300,
        hours: 40 + Math.random() * 15,
        percentage: 12 + Math.random() * 3,
        salesPerLaborHour: 180 + Math.random() * 50
      },
      
      cashManagement: {
        depositsAccepted: 400 + Math.random() * 200,
        depositsRedeemed: 350 + Math.random() * 150,
        paidIn: 50 + Math.random() * 100,
        paidOut: 25 + Math.random() * 50
      },
      
      giftCards: {
        issueAmount: 200 + Math.random() * 100,
        issueCount: 3 + Math.floor(Math.random() * 5),
        reloadAmount: 80 + Math.random() * 50,
        reloadCount: 1 + Math.floor(Math.random() * 3)
      },
      
      paymentBreakdown: {
        nonCash: 6500 + Math.random() * 1000,
        totalCash: 1300 + Math.random() * 500,
        calculatedCash: 1300 + Math.random() * 500,
        tips: 100 + Math.random() * 50
      },
      
      destinations: [
        { name: 'Drive Thru', quantity: 200, total: 6500, percent: 76.5 },
        { name: 'DoorDash', quantity: 25, total: 800, percent: 9.4 },
        { name: 'Online Ordering', quantity: 15, total: 500, percent: 5.9 },
        { name: 'Dine In', quantity: 10, total: 350, percent: 4.1 },
        { name: 'KIOSK', quantity: 8, total: 350, percent: 4.1 }
      ],
      
      revenueItems: [
        { name: 'COMBO', quantity: 95, total: 1500, percent: 17.6 },
        { name: 'TACOS', quantity: 320, total: 1200, percent: 14.1 },
        { name: 'BURRITOS', quantity: 150, total: 900, percent: 10.6 },
        { name: 'DRINKS', quantity: 180, total: 650, percent: 7.6 },
        { name: 'SIDES', quantity: 75, total: 400, percent: 4.7 }
      ],
      
      tenders: [
        { name: 'Credit Card', quantity: 180, payments: 5500, tips: 80, total: 5580, percent: 65.6 },
        { name: 'Cash', quantity: 70, payments: 1300, tips: 0, total: 1300, percent: 15.3 },
        { name: 'Debit Card', quantity: 50, payments: 1200, tips: 20, total: 1220, percent: 14.4 },
        { name: 'Mobile Pay', quantity: 25, payments: 500, tips: 0, total: 500, percent: 5.9 }
      ],
      
      discounts: [
        { name: 'Employee Discount', quantity: 5, total: 25, percent: 45.5 },
        { name: 'Promotional Discount', quantity: 3, total: 30, percent: 54.5 }
      ],
      
      promotions: [
        { name: 'Happy Hour', quantity: 2, total: 15, percent: 100 }
      ],
      
      taxes: [
        { name: 'Sales Tax', quantity: 1, total: 680, percent: 100 }
      ],
      
      voids: 35,
      refunds: 20,
      surcharges: 25,
      expenses: 150
    };
    
    return {
      success: true,
      data: mockSalesData
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Real PDF parsing function placeholder
export const parseRealPDFContent = async (fileContent: ArrayBuffer): Promise<string> => {
  // This would use a library like pdf-parse in production
  // For now, return empty string
  return '';
};

// Extract specific data patterns from PDF text
export const extractSalesMetrics = (pdfText: string): Partial<SalesData> => {
  const patterns = {
    grossSales: /Gross Sales[\s:$]+([\d,]+\.?\d*)/i,
    netSales: /Net Sales[\s:$]+([\d,]+\.?\d*)/i,
    orderCount: /Order Count[\s:]+([\d,]+)/i,
    laborCost: /Labor Cost[\s:$]+([\d,]+\.?\d*)/i,
    cashTotal: /Cash Total[\s:$]+([\d,]+\.?\d*)/i
  };
  
  const extracted: Partial<SalesData> = {};
  
  Object.entries(patterns).forEach(([key, pattern]) => {
    const match = pdfText.match(pattern);
    if (match) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(value)) {
        // Type assertion needed here since we're dynamically setting properties
        (extracted as any)[key] = value;
      }
    }
  });
  
  return extracted;
};
