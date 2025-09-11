import { format } from 'date-fns';

interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeCharts?: boolean;
  includeInsights?: boolean;
  customBranding?: {
    logoUrl?: string;
    companyName?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
  };
  templateId?: string;
  compression?: boolean;
  password?: string;
}

interface ExportMetadata {
  generatedAt: Date;
  generatedBy: string;
  dataRange: {
    from: Date;
    to: Date;
  };
  recordCount: number;
  version: string;
}

interface ScheduledExport {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  options: ExportOptions;
  metadata: ExportMetadata;
  nextRun: Date;
  enabled: boolean;
}

class EnhancedExportService {
  private baseUrl = '/api/exports';

  /**
   * Export comprehensive analytics report with advanced formatting
   */
  async exportAnalyticsReport(data: any, options: ExportOptions): Promise<Blob> {
    const requestBody = {
      data,
      options,
      metadata: this.generateMetadata(data)
    };

    const response = await fetch(`${this.baseUrl}/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Export financial summary with custom templates
   */
  async exportFinancialSummary(
    kpiData: any, 
    transactionData: any[], 
    options: ExportOptions
  ): Promise<Blob> {
    const requestBody = {
      kpiData,
      transactionData: this.sanitizeData(transactionData),
      options,
      metadata: this.generateMetadata({ kpiData, transactionData })
    };

    const response = await fetch(`${this.baseUrl}/financial-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Export team comparison report with charts
   */
  async exportTeamComparison(
    teamsData: any[], 
    comparisonMetrics: any[],
    options: ExportOptions
  ): Promise<Blob> {
    const requestBody = {
      teamsData,
      comparisonMetrics,
      options: {
        ...options,
        includeCharts: true // Always include charts for team comparison
      },
      metadata: this.generateMetadata({ teamsData, comparisonMetrics })
    };

    const response = await fetch(`${this.baseUrl}/team-comparison`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Export custom report based on template
   */
  async exportCustomReport(
    templateId: string,
    data: any,
    options: ExportOptions
  ): Promise<Blob> {
    const requestBody = {
      templateId,
      data: this.sanitizeData(data),
      options,
      metadata: this.generateMetadata(data)
    };

    const response = await fetch(`${this.baseUrl}/custom-template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Batch export multiple reports
   */
  async batchExport(exports: Array<{
    type: string;
    data: any;
    options: ExportOptions;
    filename?: string;
  }>): Promise<Blob> {
    const requestBody = {
      exports: exports.map(exp => ({
        ...exp,
        data: this.sanitizeData(exp.data),
        metadata: this.generateMetadata(exp.data)
      }))
    };

    const response = await fetch(`${this.baseUrl}/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Batch export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Schedule automated report generation
   */
  async scheduleExport(schedule: Omit<ScheduledExport, 'id'>): Promise<string> {
    const response = await fetch(`${this.baseUrl}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schedule)
    });

    if (!response.ok) {
      throw new Error(`Failed to schedule export: ${response.statusText}`);
    }

    const result = await response.json();
    return result.id;
  }

  /**
   * Get scheduled exports
   */
  async getScheduledExports(): Promise<ScheduledExport[]> {
    const response = await fetch(`${this.baseUrl}/schedule`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch scheduled exports: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update scheduled export
   */
  async updateScheduledExport(
    id: string, 
    updates: Partial<ScheduledExport>
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/schedule/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error(`Failed to update scheduled export: ${response.statusText}`);
    }
  }

  /**
   * Delete scheduled export
   */
  async deleteScheduledExport(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/schedule/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to delete scheduled export: ${response.statusText}`);
    }
  }

  /**
   * Export data as CSV with advanced formatting
   */
  exportToCSV(
    data: any[], 
    filename: string, 
    options: {
      headers?: string[];
      delimiter?: string;
      includeMetadata?: boolean;
    } = {}
  ): void {
    const { delimiter = ',', includeMetadata = true } = options;
    
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    let csv = '';
    
    // Add metadata header if requested
    if (includeMetadata) {
      csv += `# Generated on ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n`;
      csv += `# Records: ${data.length}\n`;
      csv += '\n';
    }

    // Add headers
    const headers = options.headers || Object.keys(data[0]);
    csv += headers.join(delimiter) + '\n';

    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(delimiter) || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      });
      csv += values.join(delimiter) + '\n';
    });

    this.downloadText(csv, filename, 'text/csv');
  }

  /**
   * Export data as JSON with metadata
   */
  exportToJSON(data: any, filename: string, options: {
    pretty?: boolean;
    includeMetadata?: boolean;
  } = {}): void {
    const { pretty = true, includeMetadata = true } = options;
    
    const exportData = includeMetadata ? {
      metadata: this.generateMetadata(data),
      data
    } : data;

    const jsonString = pretty 
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);

    this.downloadText(jsonString, filename, 'application/json');
  }

  /**
   * Generate comprehensive filename with timestamp and filters
   */
  generateFilename(
    baseFilename: string,
    extension: string,
    context: {
      from?: Date;
      to?: Date;
      team?: string;
      filters?: Record<string, any>;
    } = {}
  ): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    
    let filename = `${baseFilename}_${timestamp}`;
    
    if (context.from && context.to) {
      const fromStr = format(context.from, 'yyyy-MM-dd');
      const toStr = format(context.to, 'yyyy-MM-dd');
      filename += `_${fromStr}_to_${toStr}`;
    }
    
    if (context.team) {
      filename += `_${context.team.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
    
    return `${filename}.${extension}`;
  }

  /**
   * Download blob with proper filename
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Download text content as file
   */
  private downloadText(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    this.downloadBlob(blob, filename);
  }

  /**
   * Generate metadata for exports
   */
  private generateMetadata(data: any): ExportMetadata {
    const recordCount = Array.isArray(data) 
      ? data.length 
      : data.transactionData?.length || 0;
    
    return {
      generatedAt: new Date(),
      generatedBy: 'Finance Analytics System', // Could be user-specific
      dataRange: {
        from: new Date(), // Should be actual data range
        to: new Date()
      },
      recordCount,
      version: '2.0.0'
    };
  }

  /**
   * Sanitize data for export (remove sensitive fields, format values)
   */
  private sanitizeData(data: any): any {
    if (!data) return data;
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeItem(item));
    }
    
    return this.sanitizeItem(data);
  }

  private sanitizeItem(item: any): any {
    if (typeof item !== 'object' || item === null) return item;
    
    const sanitized = { ...item };
    
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.apiKey;
    
    // Format dates
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] instanceof Date) {
        sanitized[key] = sanitized[key].toISOString();
      }
    });
    
    return sanitized;
  }

  /**
   * Validate export options
   */
  validateExportOptions(options: ExportOptions): void {
    if (!options.format) {
      throw new Error('Export format is required');
    }
    
    const validFormats = ['pdf', 'excel', 'csv', 'json'];
    if (!validFormats.includes(options.format)) {
      throw new Error(`Invalid format: ${options.format}. Valid formats: ${validFormats.join(', ')}`);
    }
  }

  /**
   * Get export templates
   */
  async getExportTemplates(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    supportedFormats: string[];
  }>> {
    const response = await fetch(`${this.baseUrl}/templates`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch export templates: ${response.statusText}`);
    }
    
    return response.json();
  }
}

export const enhancedExportService = new EnhancedExportService();
export default enhancedExportService;