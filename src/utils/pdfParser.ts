
import { SalesData, LaborData, CashManagementData, GiftCardData, PaymentBreakdown } from '@/types/sales';
import { v4 as uuidv4 } from 'uuid';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';

// Vite + PDF.js worker setup
// @ts-ignore - Vite worker import type
import PdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker';
GlobalWorkerOptions.workerPort = new PdfWorker();

export interface ParsedPDFData {
  success: boolean;
  data?: SalesData;
  error?: string;
}

// Mock PDF parser - in production, you'd use a library like pdf-parse or pdf2pic
export const parseBrinkPOSReport = async (file: File, location: string, date: Date): Promise<ParsedPDFData> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfText = await parseRealPDFContent(arrayBuffer);

    if (!pdfText || pdfText.trim().length < 20) {
      throw new Error('Unable to read PDF content');
    }

    const extracted = extractSalesMetrics(pdfText);

    const orderCount = extracted.orderCount ?? 0;
    const netSales = extracted.netSales ?? 0;
    const grossSales = extracted.grossSales ?? extracted.netSales ?? 0;

    const totalCash = (extracted as any).paymentBreakdown?.totalCash ?? (extracted as any).cashTotal ?? 0;
    const tips = (extracted as any).paymentBreakdown?.tips ?? (extracted as any).tips ?? 0;
    const nonCash = (extracted as any).paymentBreakdown?.nonCash ?? (netSales && totalCash ? Math.max(netSales - totalCash, 0) : 0);

    const labor: LaborData = {
      cost: extracted.labor?.cost ?? 0,
      hours: extracted.labor?.hours ?? 0,
      percentage: extracted.labor?.percentage ?? 0,
      salesPerLaborHour: extracted.labor?.salesPerLaborHour ?? (extracted.netSales && extracted.labor?.hours ? extracted.netSales / extracted.labor.hours : 0),
    };

    const cashManagement: CashManagementData = {
      depositsAccepted: extracted.cashManagement?.depositsAccepted ?? 0,
      depositsRedeemed: extracted.cashManagement?.depositsRedeemed ?? 0,
      paidIn: extracted.cashManagement?.paidIn ?? 0,
      paidOut: extracted.cashManagement?.paidOut ?? 0,
    };

    const giftCards: GiftCardData = {
      issueAmount: (extracted as any).giftCards?.issueAmount ?? 0,
      issueCount: (extracted as any).giftCards?.issueCount ?? 0,
      reloadAmount: (extracted as any).giftCards?.reloadAmount ?? 0,
      reloadCount: (extracted as any).giftCards?.reloadCount ?? 0,
    };

    const paymentBreakdown: PaymentBreakdown = {
      nonCash,
      totalCash,
      calculatedCash: totalCash,
      tips,
    };

    const salesData: SalesData = {
      id: uuidv4(),
      date: date.toISOString().split('T')[0],
      location,
      grossSales,
      netSales,
      orderCount,
      orderAverage: orderCount ? netSales / orderCount : 0,
      labor,
      cashManagement,
      giftCards,
      paymentBreakdown,
      destinations: [],
      revenueItems: [],
      tenders: [],
      discounts: [],
      promotions: [],
      taxes: [],
      voids: (extracted as any).voids ?? 0,
      refunds: (extracted as any).refunds ?? 0,
      surcharges: (extracted as any).surcharges ?? 0,
      expenses: (extracted as any).expenses ?? 0,
    };

    return { success: true, data: salesData };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

// Real PDF parsing function placeholder
export const parseRealPDFContent = async (fileContent: ArrayBuffer): Promise<string> => {
  try {
    const loadingTask = getDocument({ data: fileContent });
    const pdf = await loadingTask.promise;
    let text = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content: any = await page.getTextContent();
      const strings = (content.items || [])
        .map((item: any) => (item && typeof item.str === 'string' ? item.str : ''))
        .join(' ');
      text += `\n${strings}`;
    }
    if (text && text.trim().length > 0) {
      console.debug('[pdfParser] Extracted text length:', text.length);
      console.debug('[pdfParser] Text preview:', text.slice(0, 500));
    } else {
      console.warn('[pdfParser] Extracted empty text from PDF');
    }
    return text;
  } catch (err: any) {
    console.error('[pdfParser] PDF parsing failed:', err);
    const msg = String(err?.message || err);
    if (msg.toLowerCase().includes('worker')) {
      throw new Error('PDF parsing failed due to worker load issue. The PDF.js worker could not start. This is usually fixed by bundling the worker via Vite (?worker import).');
    }
    throw err;
  }
};


// Extract specific data patterns from PDF text
export const extractSalesMetrics = (pdfText: string): Partial<SalesData> => {
  console.log('[pdfParser] Starting sales metrics extraction');
  console.log('[pdfParser] PDF text length:', pdfText.length);
  console.log('[pdfParser] First 500 chars of PDF text:', pdfText.slice(0, 500));
  
  // Normalize the text by removing extra spaces but preserve line structure
  const normalizedText = pdfText.replace(/\s+/g, ' ').trim();
  
  // Helper function to find numeric values after specific keywords - updated for Brink POS format
  const findValue = (patterns: string[], text: string): number => {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern, 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        const cleanValue = match[1].replace(/[,$\s]/g, '');
        const value = parseFloat(cleanValue);
        if (!isNaN(value)) {
          console.log(`[pdfParser] Found ${pattern}: ${value}`);
          return value;
        }
      }
    }
    return 0;
  };

  // Updated patterns for Brink POS format based on user's report
  const grossSales = findValue([
    'Gross Sales[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'Total Gross[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'Gross[\\s:$]*([0-9,]+\\.?[0-9]*)'
  ], normalizedText);

  const netSales = findValue([
    'Net Sales[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'Total Net[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'Net[\\s:$]*([0-9,]+\\.?[0-9]*)'
  ], normalizedText);

  const orderCount = findValue([
    'Order Count[\\s:]*([0-9,]+)',
    'Total Orders[\\s:]*([0-9,]+)',
    'Orders[\\s:]*([0-9,]+)',
    'Count[\\s:]*([0-9,]+)'
  ], normalizedText);

  const totalCash = findValue([
    'Total Cash[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'Cash Total[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'Cash[\\s:$]*([0-9,]+\\.?[0-9]*)'
  ], normalizedText);

  const laborHours = findValue([
    'Labor Hours[\\s:]*([0-9,]+\\.?[0-9]*)',
    'Hours[\\s:]*([0-9,]+\\.?[0-9]*)',
    'Total Hours[\\s:]*([0-9,]+\\.?[0-9]*)'
  ], normalizedText);

  const tips = findValue([
    'Tips[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'Total Tips[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'Tip Total[\\s:$]*([0-9,]+\\.?[0-9]*)'
  ], normalizedText);

  // Calculate derived values
  const orderAverage = orderCount > 0 ? grossSales / orderCount : 0;
  const laborCost = laborHours * 15; // Estimate based on $15/hour
  const laborPercentage = grossSales > 0 ? (laborCost / grossSales) * 100 : 0;
  const salesPerLaborHour = laborHours > 0 ? grossSales / laborHours : 0;
  const nonCash = grossSales - totalCash;

  console.log('[pdfParser] Extracted metrics:', {
    grossSales,
    netSales,
    orderCount,
    orderAverage,
    totalCash,
    nonCash,
    laborCost,
    laborHours,
    laborPercentage,
    salesPerLaborHour,
    tips
  });

  return {
    grossSales,
    netSales,
    orderCount,
    orderAverage,
    labor: {
      cost: laborCost,
      hours: laborHours,
      percentage: laborPercentage,
      salesPerLaborHour
    },
    paymentBreakdown: {
      nonCash,
      totalCash,
      calculatedCash: totalCash,
      tips
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
    destinations: [],
    revenueItems: [],
    tenders: [],
    discounts: [],
    promotions: [],
    taxes: []
  };
};
