
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
  const text = pdfText.replace(/\s+/g, ' ').trim();

  const findNumber = (patterns: RegExp[]): number | undefined => {
    for (const pattern of patterns) {
      const m = text.match(pattern);
      if (m && m[1]) {
        const val = parseFloat(m[1].replace(/[,$]/g, ''));
        if (!Number.isNaN(val)) return val;
      }
    }
    return undefined;
  };

  const grossSales = findNumber([
    /Gross Sales[\s:$]+([\d,]+(?:\.\d+)?)/i,
    /Total Sales[\s:$]+([\d,]+(?:\.\d+)?)/i,
  ]);

  const netSales = findNumber([
    /Net Sales[\s:$]+([\d,]+(?:\.\d+)?)/i,
  ]);

  const orderCount = findNumber([
    /Orders? Count[\s:]+([\d,]+)/i,
    /Total Orders?[\s:]+([\d,]+)/i,
    /Guests?[\s:]+([\d,]+)/i,
  ]);

  const laborCost = findNumber([
    /Labor Cost[\s:$]+([\d,]+(?:\.\d+)?)/i,
  ]);

  const laborHours = findNumber([
    /Labor (?:Hrs|Hours)[\s:]+([\d,]+(?:\.\d+)?)/i,
  ]);

  const laborPct = findNumber([
    /Labor (?:Percent|%)[\s:]+([\d.,]+)%/i,
    /Labor %[\s:]+([\d.,]+)%/i,
  ]);

  const splh = findNumber([
    /Sales\/Labor Hour[\s:$]+([\d,]+(?:\.\d+)?)/i,
    /SPLH[\s:$]+([\d,]+(?:\.\d+)?)/i,
  ]);

  const totalCash = findNumber([
    /Total Cash[\s:$]+([\d,]+(?:\.\d+)?)/i,
    /Cash Total[\s:$]+([\d,]+(?:\.\d+)?)/i,
  ]);

  const tips = findNumber([
    /Tips?[\s:$]+([\d,]+(?:\.\d+)?)/i,
    /Gratuity[\s:$]+([\d,]+(?:\.\d+)?)/i,
  ]);

  const paidIn = findNumber([
    /Paid In[\s:$]+([\d,]+(?:\.\d+)?)/i,
  ]);

  const paidOut = findNumber([
    /Paid Out[\s:$]+([\d,]+(?:\.\d+)?)/i,
  ]);

  const depAcc = findNumber([
    /Deposits Accepted[\s:$]+([\d,]+(?:\.\d+)?)/i,
  ]);

  const depRed = findNumber([
    /Deposits Redeemed[\s:$]+([\d,]+(?:\.\d+)?)/i,
  ]);

  const voids = findNumber([/Voids?[\s:]+([\d,]+)/i]);
  const refunds = findNumber([/Refunds?[\s:]+([\d,]+)/i]);
  const surcharges = findNumber([/Surcharges?[\s:$]+([\d,]+(?:\.\d+)?)/i]);
  const expenses = findNumber([/Expenses?[\s:$]+([\d,]+(?:\.\d+)?)/i]);

  const result: Partial<SalesData> = {
    grossSales,
    netSales,
    orderCount: orderCount ? Math.round(orderCount) : undefined,
    labor: {
      cost: laborCost ?? 0,
      hours: laborHours ?? 0,
      percentage: laborPct ?? 0,
      salesPerLaborHour: splh ?? 0,
    },
    cashManagement: {
      depositsAccepted: depAcc ?? 0,
      depositsRedeemed: depRed ?? 0,
      paidIn: paidIn ?? 0,
      paidOut: paidOut ?? 0,
    },
    voids: voids ?? 0,
    refunds: refunds ?? 0,
    surcharges: surcharges ?? 0,
    expenses: expenses ?? 0,
  } as Partial<SalesData> & { cashTotal?: number; tips?: number };

  (result as any).cashTotal = totalCash;
  (result as any).tips = tips;

  return result;
};
