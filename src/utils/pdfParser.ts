
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
  extractedDate?: Date;
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
    const extractedDate = extracted.extractedDate;
    
    // Use extracted date if available, otherwise use provided date
    const salesDate = extractedDate || date;

    const orderCount = extracted.orderCount ?? 0;
    const netSales = extracted.netSales ?? 0;
    const grossSales = extracted.grossSales ?? extracted.netSales ?? 0;

    const totalCash = (extracted as any).paymentBreakdown?.totalCash ?? (extracted as any).cashTotal ?? 0;
    const tips = (extracted as any).paymentBreakdown?.tips ?? (extracted as any).tips ?? 0;
    const nonCash = (extracted as any).paymentBreakdown?.nonCash ?? 0;

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
      date: salesDate.toISOString().split('T')[0],
      location,
      grossSales,
      netSales,
      orderCount,
      orderAverage: orderCount ? netSales / orderCount : 0,
      labor,
      cashManagement,
      giftCards,
      paymentBreakdown,
      destinations: (extracted as any).destinations ?? [],
      revenueItems: (extracted as any).revenueItems ?? [],
      tenders: (extracted as any).tenders ?? [],
      discounts: (extracted as any).discounts ?? [],
      promotions: (extracted as any).promotions ?? [],
      taxes: (extracted as any).taxes ?? [],
      voids: (extracted as any).voids ?? 0,
      refunds: (extracted as any).refunds ?? 0,
      surcharges: (extracted as any).surcharges ?? 0,
      expenses: (extracted as any).expenses ?? 0,
    };

    return { success: true, data: salesData, extractedDate };
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
export const extractSalesMetrics = (pdfText: string): Partial<SalesData> & { extractedDate?: Date } => {
  console.log('[pdfParser] Starting sales metrics extraction');
  console.log('[pdfParser] PDF text length:', pdfText.length);
  console.log('[pdfParser] First 500 chars of PDF text:', pdfText.slice(0, 500));
  
  // Normalize the text by removing extra spaces but preserve line structure
  const normalizedText = pdfText.replace(/\s+/g, ' ').trim();
  
  // Extract date from PDF - Brink POS format includes day name and full date
  const extractDate = (text: string): Date | undefined => {
    // Pattern: "Friday, August 15, 2025" or similar formats
    const datePatterns = [
      /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/i,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      /(\d{4})-(\d{1,2})-(\d{1,2})/
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          if (match.length === 4 && isNaN(Number(match[1]))) {
            // Format: "Month DD, YYYY"
            const [, month, day, year] = match;
            const monthIndex = new Date(`${month} 1, 2000`).getMonth();
            const extractedDate = new Date(parseInt(year), monthIndex, parseInt(day));
            console.log('[pdfParser] Extracted date from PDF:', extractedDate);
            return extractedDate;
          } else if (match.length === 4) {
            // Format: "MM/DD/YYYY" or "YYYY-MM-DD"
            let [, part1, part2, part3] = match;
            let extractedDate: Date;
            
            if (part1.length === 4) {
              // YYYY-MM-DD format
              extractedDate = new Date(parseInt(part1), parseInt(part2) - 1, parseInt(part3));
            } else {
              // MM/DD/YYYY format
              extractedDate = new Date(parseInt(part3), parseInt(part1) - 1, parseInt(part2));
            }
            console.log('[pdfParser] Extracted date from PDF:', extractedDate);
            return extractedDate;
          }
        } catch (error) {
          console.warn('[pdfParser] Failed to parse extracted date:', match[0]);
        }
      }
    }
    return undefined;
  };
  
  const extractedDate = extractDate(pdfText);
  
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

  // Enhanced cash extraction patterns for Brink POS
  const totalCash = findValue([
    'Total Cash[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'Cash Total[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'Cash[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'CASH[\\s:$]*([0-9,]+\\.?[0-9]*)'
  ], normalizedText);

  // Direct non-cash extraction with expanded patterns (use exact value from PDF, no calculations)
  const directNonCash = findValue([
    'Non[\\-–—‑\\s]?Cash\\s+Payments?[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'NON[\\-–—‑\\s]?CASH\\s+PAYMENTS?[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'Noncash\\s+Payments?[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'Non[\\-–—‑\\s]?Cash\\s+Total[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'Total\\s+Non[\\-–—‑\\s]?Cash[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'Electronic\\s+Payments[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'Card\\s+Total[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'Total\\s+Card[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'Credit\\s+Card[\\s:$]*([0-9,]+\\.?[0-9]*)'
  ], normalizedText);

  // Secondary broad match to catch unusual dash/spacing variants
  let broadNonCash = 0;
  try {
    const broadMatch = normalizedText.match(/Non[\-–—‑\s]?Cash(?:\s+Payments?)?[^0-9]{0,20}([0-9,]+\.?[0-9]*)/i);
    if (broadMatch && broadMatch[1]) {
      broadNonCash = parseFloat(broadMatch[1].replace(/[,$\s]/g, '')) || 0;
      console.log('[pdfParser] Broad non-cash match:', broadMatch[0], '=>', broadNonCash);
    }
  } catch {}

  // Use direct non-cash value from PDF only - no calculations
  const nonCash = directNonCash || broadNonCash;
  console.log('[pdfParser] Using non-cash value from PDF:', { directNonCash, broadNonCash, chosen: nonCash });

  // Extract labor and tips after payments to keep flow readable
  const laborHours = findValue([
    'Labor Hours[\\s:]*([0-9,]+\\.?[0-9]*)',
    'Hours[\\s:]*([0-9,]+\\.?[0-9]*)',
    'Total Hours[\\s:]*([0-9,]+\\.?[0-9]*)',
    'LABOR HOURS[\\s:]*([0-9,]+\\.?[0-9]*)'
  ], normalizedText);

  const tips = findValue([
    'Tips[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'Total Tips[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'Tip Total[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'TIPS[\\s:$]*([0-9,]+\\.?[0-9]*)'
  ], normalizedText);

  // Extract "+ Tax" as Tax Paid (use exact value from PDF)
  const plusTax = findValue([
    '\\+\\s*Sales?\\s*Tax[\\s:$]*([0-9,]+\\.?[0-9]*)',
    '\\+\\s*Tax[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'Sales?\\s*Tax[\\s:$]*([0-9,]+\\.?[0-9]*)',
    'Tax\\s*Total[\\s:$]*([0-9,]+\\.?[0-9]*)'
  ], normalizedText);
  const taxesEntries = plusTax > 0 ? [{ name: '+ Tax', quantity: 1, total: plusTax, percent: 0 }] : [];
  console.log('[pdfParser] Extracted + Tax as taxPaid:', plusTax);

  // Parse multi-page sections (Revenue Items, Tenders, Destinations, Discounts, Promotions)
  const getSectionText = (startPatterns: string[], text: string): string => {
    let startIdx = -1;
    for (const p of startPatterns) {
      const m = new RegExp(p, 'i').exec(text);
      if (m) { startIdx = m.index + m[0].length; break; }
    }
    if (startIdx === -1) return '';
    const nextTitles = ['Destinations?', 'Revenue\\s+(?:Centers?|Items?)', 'Tenders?', 'Tender\\s+Summary', 'Discounts?', 'Promotions?', 'Taxes?', '\\+\\s*Tax'];
    let endIdx = text.length;
    for (const nt of nextTitles) {
      const r = new RegExp(nt, 'i');
      const m2 = r.exec(text.slice(startIdx));
      if (m2) {
        const idx = startIdx + m2.index;
        if (idx < endIdx) endIdx = idx;
      }
    }
    return text.slice(startIdx, endIdx);
  };

  const parseEntries = (segment: string) => {
    const cleaned = segment.replace(/\s{2,}/g, ' ').trim();
    const results: { name: string; quantity: number; total: number; percent: number }[] = [];
    const seen: Record<string, number> = {};
    // Pattern with quantity and total
    const re1 = /([A-Za-z][A-Za-z0-9&\/\-\.\s\(\)%]+?)\s+([0-9,]+)\s+\$?\s*([0-9,]+(?:\.[0-9]{2})?)/g;
    let m: RegExpExecArray | null;
    while ((m = re1.exec(cleaned)) !== null) {
      const name = m[1].trim();
      if (/^total(s)?$/i.test(name)) continue;
      const quantity = parseInt((m[2] || '0').replace(/[,]/g, ''), 10) || 0;
      const total = parseFloat((m[3] || '0').replace(/[,$]/g, '')) || 0;
      const key = name.toLowerCase();
      if (seen[key] !== undefined) {
        results[seen[key]].quantity += quantity;
        results[seen[key]].total += total;
      } else {
        seen[key] = results.length;
        results.push({ name, quantity, total, percent: 0 });
      }
    }
    // Fallback pattern: name + total only
    const re2 = /([A-Za-z][A-Za-z0-9&\/\-\.\s\(\)%]+?)\s+\$?\s*([0-9,]+(?:\.[0-9]{2})?)/g;
    while ((m = re2.exec(cleaned)) !== null) {
      const name = m[1].trim();
      if (/^total(s)?$/i.test(name)) continue;
      const total = parseFloat((m[2] || '0').replace(/[,$]/g, '')) || 0;
      const key = name.toLowerCase();
      if (seen[key] !== undefined) {
        if (results[seen[key]].total === 0) results[seen[key]].total = total;
      } else {
        seen[key] = results.length;
        results.push({ name, quantity: 0, total, percent: 0 });
      }
    }
    return results;
  };

  const revenueItems = parseEntries(getSectionText(['Revenue\\s+(?:Centers?|Items?)'], normalizedText));
  const tendersRaw = parseEntries(getSectionText(['Tenders?', 'Tender\\s+Summary'], normalizedText));
  const tenders = tendersRaw.map(e => ({ ...e, payments: e.total, tips: 0 }));
  const destinations = parseEntries(getSectionText(['Destinations?'], normalizedText));
  const discounts = parseEntries(getSectionText(['Discounts?'], normalizedText));
  const promotions = parseEntries(getSectionText(['Promotions?'], normalizedText));

  // Derived metrics
  const orderAverage = orderCount > 0 ? grossSales / orderCount : 0;
  const laborCost = laborHours * 15; // Estimate based on $15/hour
  const laborPercentage = grossSales > 0 ? (laborCost / grossSales) * 100 : 0;
  const salesPerLaborHour = laborHours > 0 ? grossSales / laborHours : 0;

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
    extractedDate,
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
    destinations: destinations,
    revenueItems: revenueItems,
    tenders: tenders,
    discounts: discounts,
    promotions: promotions,
    taxes: taxesEntries
  };
};
