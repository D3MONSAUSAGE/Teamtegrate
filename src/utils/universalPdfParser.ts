import { SalesData, LaborData, CashManagementData, GiftCardData, PaymentBreakdown } from '@/types/sales';
import { v4 as uuidv4 } from 'uuid';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import { supabase } from '@/integrations/supabase/client';

// @ts-ignore - Vite worker import type
import PdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker';
GlobalWorkerOptions.workerPort = new PdfWorker();

export interface ParsedPDFData {
  success: boolean;
  data?: SalesData;
  error?: string;
  extractedDate?: Date;
  posSystem?: string;
  confidenceScore?: number;
  validationErrors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  suggestedValue?: any;
}

export interface POSConfig {
  id: string;
  system_name: string;
  config_data: {
    patterns: {
      [key: string]: string[];
    };
    dateFormats?: string[];
    sectionHeaders?: {
      [key: string]: string[];
    };
  };
}

class UniversalPDFParser {
  private posConfigs: POSConfig[] = [];
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    try {
      const { data: configs, error } = await supabase
        .from('pos_system_configs')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      
      this.posConfigs = (configs || []).map(config => ({
        ...config,
        config_data: config.config_data as any
      }));
      this.initialized = true;
      console.log('[UniversalPDFParser] Initialized with', this.posConfigs.length, 'POS configs');
    } catch (error) {
      console.warn('[UniversalPDFParser] Failed to load POS configs, using defaults:', error);
      this.posConfigs = this.getDefaultConfigs();
      this.initialized = true;
    }
  }

  private getDefaultConfigs(): POSConfig[] {
    return [
      {
        id: 'brink',
        system_name: 'brink',
        config_data: {
          patterns: {
            grossSales: ['Gross Sales[\\s:$]*([0-9,]+\\.?[0-9]*)', 'Total Gross[\\s:$]*([0-9,]+\\.?[0-9]*)'],
            netSales: ['Net Sales[\\s:$]*([0-9,]+\\.?[0-9]*)', 'Total Net[\\s:$]*([0-9,]+\\.?[0-9]*)'],
            orderCount: ['Order Count[\\s:]*([0-9,]+)', 'Total Orders[\\s:]*([0-9,]+)'],
            totalCash: ['Total Cash[\\s:$]*([0-9,]+\\.?[0-9]*)', 'Cash Total[\\s:$]*([0-9,]+\\.?[0-9]*)'],
            nonCash: ['Non[\\-–—‑\\s]?Cash\\s+Payments?[\\s:$]*([0-9,]+\\.?[0-9]*)', 'NON[\\-–—‑\\s]?CASH\\s+PAYMENTS?[\\s:$]*([0-9,]+\\.?[0-9]*)']
          }
        }
      },
      {
        id: 'square',
        system_name: 'square',
        config_data: {
          patterns: {
            grossSales: ['Gross Amount[\\s:$]*([0-9,]+\\.?[0-9]*)', 'Total Sales[\\s:$]*([0-9,]+\\.?[0-9]*)'],
            netSales: ['Net Amount[\\s:$]*([0-9,]+\\.?[0-9]*)', 'Net Sales[\\s:$]*([0-9,]+\\.?[0-9]*)'],
            orderCount: ['Transaction Count[\\s:]*([0-9,]+)', 'Orders[\\s:]*([0-9,]+)'],
            totalCash: ['Cash[\\s:$]*([0-9,]+\\.?[0-9]*)', 'Cash Payments[\\s:$]*([0-9,]+\\.?[0-9]*)'],
            nonCash: ['Card[\\s:$]*([0-9,]+\\.?[0-9]*)', 'Electronic[\\s:$]*([0-9,]+\\.?[0-9]*)']
          }
        }
      },
      {
        id: 'toast',
        system_name: 'toast',
        config_data: {
          patterns: {
            grossSales: ['Total Sales[\\s:$]*([0-9,]+\\.?[0-9]*)', 'Gross Revenue[\\s:$]*([0-9,]+\\.?[0-9]*)'],
            netSales: ['Net Sales[\\s:$]*([0-9,]+\\.?[0-9]*)', 'Revenue[\\s:$]*([0-9,]+\\.?[0-9]*)'],
            orderCount: ['Orders[\\s:]*([0-9,]+)', 'Check Count[\\s:]*([0-9,]+)'],
            totalCash: ['Cash[\\s:$]*([0-9,]+\\.?[0-9]*)', 'Cash Tender[\\s:$]*([0-9,]+\\.?[0-9]*)'],
            nonCash: ['Credit Card[\\s:$]*([0-9,]+\\.?[0-9]*)', 'Cards[\\s:$]*([0-9,]+\\.?[0-9]*)']
          }
        }
      }
    ];
  }

  async detectPOSSystem(pdfText: string): Promise<{ system: string; confidence: number }> {
    await this.initialize();
    
    const scores: Array<{ system: string; score: number }> = [];
    
    for (const config of this.posConfigs) {
      let score = 0;
      const patterns = config.config_data.patterns;
      
      // Check how many patterns match
      for (const [field, fieldPatterns] of Object.entries(patterns)) {
        for (const pattern of fieldPatterns) {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(pdfText)) {
            score += 1;
          }
        }
      }
      
      // Check for system-specific keywords
      const systemKeywords = this.getSystemKeywords(config.system_name);
      for (const keyword of systemKeywords) {
        if (pdfText.toLowerCase().includes(keyword.toLowerCase())) {
          score += 2; // Higher weight for system-specific keywords
        }
      }
      
      scores.push({ system: config.system_name, score });
    }
    
    // Find the system with the highest score
    const bestMatch = scores.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    
    const maxPossibleScore = Math.max(...this.posConfigs.map(c => 
      Object.values(c.config_data.patterns).flat().length + this.getSystemKeywords(c.system_name).length * 2
    ));
    
    const confidence = (bestMatch.score / maxPossibleScore) * 100;
    
    console.log('[UniversalPDFParser] POS detection scores:', scores);
    console.log('[UniversalPDFParser] Best match:', bestMatch.system, 'confidence:', confidence);
    
    return {
      system: bestMatch.system,
      confidence: Math.min(confidence, 100)
    };
  }

  private getSystemKeywords(system: string): string[] {
    const keywords: Record<string, string[]> = {
      brink: ['Brink POS', 'Brink Software', 'brinkpos.com'],
      square: ['Square', 'squareup.com', 'Square Terminal'],
      toast: ['Toast POS', 'Toast Tab', 'toasttab.com'],
      lightspeed: ['Lightspeed', 'lightspeedhq.com'],
      clover: ['Clover', 'clover.com', 'First Data']
    };
    
    return keywords[system] || [];
  }

  async parseWithSystem(pdfText: string, system: string, teamId: string, date: Date): Promise<ParsedPDFData> {
    await this.initialize();
    
    const config = this.posConfigs.find(c => c.system_name === system);
    if (!config) {
      return {
        success: false,
        error: `Unknown POS system: ${system}`,
        posSystem: system,
        confidenceScore: 0
      };
    }

    try {
      const extracted = this.extractWithConfig(pdfText, config);
      const validationErrors = this.validateExtractedData(extracted);
      
      // Calculate confidence based on successful extractions
      const confidenceScore = this.calculateConfidence(extracted, validationErrors);
      
      const salesData = this.buildSalesData(extracted, teamId, date);
      
      return {
        success: true,
        data: salesData,
        posSystem: system,
        confidenceScore,
        validationErrors,
        extractedDate: extracted.extractedDate
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse with ${system}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        posSystem: system,
        confidenceScore: 0
      };
    }
  }

  private extractWithConfig(pdfText: string, config: POSConfig): any {
    const normalizedText = pdfText.replace(/\s+/g, ' ').trim();
    const patterns = config.config_data.patterns;
    
    // Extract basic metrics using config patterns
    const extracted: any = {
      extractedDate: this.extractDate(pdfText)
    };
    
    // Extract each field using its patterns
    for (const [field, fieldPatterns] of Object.entries(patterns)) {
      extracted[field] = this.findValue(fieldPatterns, normalizedText);
    }
    
    // Calculate derived fields
    if (extracted.grossSales && extracted.orderCount) {
      extracted.orderAverage = extracted.grossSales / extracted.orderCount;
    }
    
    // Extract labor data
    extracted.laborHours = this.findValue([
      'Labor Hours[\\s:]*([0-9,]+\\.?[0-9]*)',
      'Hours[\\s:]*([0-9,]+\\.?[0-9]*)',
      'Total Hours[\\s:]*([0-9,]+\\.?[0-9]*)'
    ], normalizedText);
    
    extracted.tips = this.findValue([
      'Tips[\\s:$]*([0-9,]+\\.?[0-9]*)',
      'Total Tips[\\s:$]*([0-9,]+\\.?[0-9]*)',
      'Tip Total[\\s:$]*([0-9,]+\\.?[0-9]*)'
    ], normalizedText);
    
    // Extract tax information
    extracted.taxes = this.findValue([
      '\\+\\s*Sales?\\s*Tax[\\s:$]*([0-9,]+\\.?[0-9]*)',
      '\\+\\s*Tax[\\s:$]*([0-9,]+\\.?[0-9]*)',
      'Sales?\\s*Tax[\\s:$]*([0-9,]+\\.?[0-9]*)'
    ], normalizedText);
    
    return extracted;
  }

  private findValue(patterns: string[], text: string): number {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern, 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        const cleanValue = match[1].replace(/[,$\s]/g, '');
        const value = parseFloat(cleanValue);
        if (!isNaN(value)) {
          return value;
        }
      }
    }
    return 0;
  }

  private extractDate(text: string): Date | undefined {
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
            return new Date(parseInt(year), monthIndex, parseInt(day));
          } else if (match.length === 4) {
            // Format: "MM/DD/YYYY" or "YYYY-MM-DD"
            let [, part1, part2, part3] = match;
            
            if (part1.length === 4) {
              // YYYY-MM-DD format
              return new Date(parseInt(part1), parseInt(part2) - 1, parseInt(part3));
            } else {
              // MM/DD/YYYY format
              return new Date(parseInt(part3), parseInt(part1) - 1, parseInt(part2));
            }
          }
        } catch (error) {
          console.warn('[UniversalPDFParser] Failed to parse extracted date:', match[0]);
        }
      }
    }
    return undefined;
  }

  private validateExtractedData(extracted: any): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Check for missing critical fields
    if (!extracted.grossSales || extracted.grossSales === 0) {
      errors.push({
        field: 'grossSales',
        message: 'Gross sales not found or is zero',
        severity: 'error'
      });
    }
    
    if (!extracted.netSales || extracted.netSales === 0) {
      errors.push({
        field: 'netSales',
        message: 'Net sales not found or is zero',
        severity: 'error'
      });
    }
    
    if (!extracted.orderCount || extracted.orderCount === 0) {
      errors.push({
        field: 'orderCount',
        message: 'Order count not found or is zero',
        severity: 'warning'
      });
    }
    
    // Business rule validations
    if (extracted.grossSales && extracted.netSales && extracted.netSales > extracted.grossSales) {
      errors.push({
        field: 'netSales',
        message: 'Net sales cannot be greater than gross sales',
        severity: 'critical',
        suggestedValue: extracted.grossSales
      });
    }
    
    // Anomaly detection
    if (extracted.grossSales && extracted.grossSales > 50000) {
      errors.push({
        field: 'grossSales',
        message: 'Unusually high gross sales amount detected',
        severity: 'warning'
      });
    }
    
    if (extracted.orderCount && extracted.orderCount > 1000) {
      errors.push({
        field: 'orderCount',
        message: 'Unusually high order count detected',
        severity: 'warning'
      });
    }
    
    return errors;
  }

  private calculateConfidence(extracted: any, validationErrors: ValidationError[]): number {
    let score = 0;
    let maxScore = 0;
    
    // Core fields (higher weight)
    const coreFields = ['grossSales', 'netSales', 'orderCount'];
    for (const field of coreFields) {
      maxScore += 25;
      if (extracted[field] && extracted[field] > 0) {
        score += 25;
      }
    }
    
    // Optional fields (lower weight)
    const optionalFields = ['totalCash', 'nonCash', 'tips', 'laborHours'];
    for (const field of optionalFields) {
      maxScore += 10;
      if (extracted[field] && extracted[field] > 0) {
        score += 10;
      }
    }
    
    // Date extraction
    maxScore += 15;
    if (extracted.extractedDate) {
      score += 15;
    }
    
    // Penalty for critical errors
    const criticalErrors = validationErrors.filter(e => e.severity === 'critical').length;
    score -= criticalErrors * 30;
    
    return Math.max(0, Math.min(100, (score / maxScore) * 100));
  }

  private buildSalesData(extracted: any, teamId: string, date: Date): SalesData {
    const salesDate = extracted.extractedDate || date;
    
    const labor: LaborData = {
      cost: extracted.laborHours * 15, // Estimate $15/hour
      hours: extracted.laborHours || 0,
      percentage: extracted.grossSales > 0 ? ((extracted.laborHours * 15) / extracted.grossSales) * 100 : 0,
      salesPerLaborHour: extracted.laborHours > 0 ? extracted.grossSales / extracted.laborHours : 0
    };
    
    const paymentBreakdown: PaymentBreakdown = {
      nonCash: extracted.nonCash || 0,
      totalCash: extracted.totalCash || 0,
      calculatedCash: extracted.totalCash || 0,
      tips: extracted.tips || 0
    };
    
    const cashManagement: CashManagementData = {
      depositsAccepted: 0,
      depositsRedeemed: 0,
      paidIn: 0,
      paidOut: 0
    };
    
    const giftCards: GiftCardData = {
      issueAmount: 0,
      issueCount: 0,
      reloadAmount: 0,
      reloadCount: 0
    };
    
    return {
      id: uuidv4(),
      date: salesDate.toISOString().split('T')[0],
      location: teamId,
      team_id: teamId,
      grossSales: extracted.grossSales || 0,
      netSales: extracted.netSales || 0,
      orderCount: extracted.orderCount || 0,
      orderAverage: extracted.orderAverage || 0,
      labor,
      cashManagement,
      giftCards,
      paymentBreakdown,
      destinations: [],
      revenueItems: [],
      tenders: [],
      discounts: [],
      promotions: [],
      taxes: extracted.taxes > 0 ? [{ name: 'Sales Tax', quantity: 1, total: extracted.taxes, percent: 0 }] : [],
      voids: 0,
      refunds: 0,
      surcharges: 0,
      expenses: 0
    };
  }

  async parseRealPDFContent(fileContent: ArrayBuffer): Promise<string> {
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
        console.debug('[UniversalPDFParser] Extracted text length:', text.length);
      } else {
        console.warn('[UniversalPDFParser] Extracted empty text from PDF');
      }
      
      return text;
    } catch (err: any) {
      console.error('[UniversalPDFParser] PDF parsing failed:', err);
      const msg = String(err?.message || err);
      if (msg.toLowerCase().includes('worker')) {
        throw new Error('PDF parsing failed due to worker load issue. The PDF.js worker could not start.');
      }
      throw err;
    }
  }

  async parseUniversalPDF(file: File, teamId: string, date: Date, forcedSystem?: string): Promise<ParsedPDFData> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfText = await this.parseRealPDFContent(arrayBuffer);

      if (!pdfText || pdfText.trim().length < 20) {
        throw new Error('Unable to read PDF content');
      }

      let system = forcedSystem;
      let confidence = 100;

      if (!system) {
        const detection = await this.detectPOSSystem(pdfText);
        system = detection.system;
        confidence = detection.confidence;
      }

      const result = await this.parseWithSystem(pdfText, system, teamId, date);
      
      // Override confidence if detection was used
      if (!forcedSystem && result.success) {
        result.confidenceScore = confidence;
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidenceScore: 0
      };
    }
  }
}

// Export singleton instance
export const universalPDFParser = new UniversalPDFParser();

// Backward compatibility function
export const parseBrinkPOSReport = async (file: File, teamId: string, date: Date): Promise<ParsedPDFData> => {
  return universalPDFParser.parseUniversalPDF(file, teamId, date, 'brink');
};

// Main parsing function
export const parseRealPDFContent = (fileContent: ArrayBuffer): Promise<string> => {
  return universalPDFParser.parseRealPDFContent(fileContent);
};

// New universal parsing function
export const parseUniversalPDF = (file: File, teamId: string, date: Date, forcedSystem?: string): Promise<ParsedPDFData> => {
  return universalPDFParser.parseUniversalPDF(file, teamId, date, forcedSystem);
};