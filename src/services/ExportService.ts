import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { SalesData, WeeklySalesData } from '@/types/sales';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { analyticsService, KPIMetrics, PerformanceInsight } from './AnalyticsService';

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  includeCharts?: boolean;
  includeInsights?: boolean;
  includeRawData?: boolean;
  dateRange?: { start: Date; end: Date };
  teamId?: string;
  customFields?: string[];
}

export interface ScheduledExport {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  format: ExportOptions['format'];
  options: ExportOptions;
  recipients: string[];
  nextRun: Date;
  isActive: boolean;
}

class ExportService {
  
  async exportSalesData(data: SalesData[], options: ExportOptions): Promise<Blob> {
    switch (options.format) {
      case 'csv':
        return this.exportToCSV(data, options);
      case 'excel':
        return this.exportToExcel(data, options);
      case 'pdf':
        return this.exportToPDF(data, options);
      case 'json':
        return this.exportToJSON(data, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  async exportWeeklyReport(weeklyData: WeeklySalesData, options: ExportOptions): Promise<Blob> {
    switch (options.format) {
      case 'csv':
        return this.exportWeeklyToCSV(weeklyData, options);
      case 'pdf':
        return this.exportWeeklyToPDF(weeklyData, options);
      default:
        throw new Error(`Unsupported weekly export format: ${options.format}`);
    }
  }

  async exportAnalyticsReport(
    kpiMetrics: KPIMetrics, 
    insights: PerformanceInsight[], 
    options: ExportOptions
  ): Promise<Blob> {
    switch (options.format) {
      case 'pdf':
        return this.exportAnalyticsToPDF(kpiMetrics, insights, options);
      case 'json':
        return this.exportAnalyticsToJSON(kpiMetrics, insights, options);
      default:
        throw new Error(`Unsupported analytics export format: ${options.format}`);
    }
  }

  private async exportToCSV(data: SalesData[], options: ExportOptions): Promise<Blob> {
    const headers = [
      'Date', 'Location', 'Team ID', 'Gross Sales', 'Net Sales', 'Order Count', 
      'Average Order', 'Labor Cost', 'Labor Hours', 'Labor %', 'Tips', 
      'Non-Cash', 'Total Cash', 'Calculated Cash'
    ];

    if (options.customFields) {
      headers.push(...options.customFields);
    }

    const rows = data.map(sale => {
      const laborPercentage = sale.labor?.cost && sale.grossSales ? 
        ((sale.labor.cost / sale.grossSales) * 100).toFixed(2) : '0';
      
      const baseRow = [
        sale.date,
        sale.location,
        sale.team_id || '',
        sale.grossSales.toFixed(2),
        sale.netSales.toFixed(2),
        sale.orderCount.toString(),
        sale.orderAverage.toFixed(2),
        sale.labor?.cost?.toFixed(2) || '0',
        sale.labor?.hours?.toString() || '0',
        laborPercentage,
        sale.paymentBreakdown?.tips?.toFixed(2) || '0',
        sale.paymentBreakdown?.nonCash?.toFixed(2) || '0',
        sale.paymentBreakdown?.totalCash?.toFixed(2) || '0',
        sale.paymentBreakdown?.calculatedCash?.toFixed(2) || '0'
      ];

      if (options.customFields) {
        baseRow.push(...options.customFields.map(field => 
          String(sale[field as keyof SalesData] || '')
        ));
      }

      return baseRow;
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  private async exportToExcel(data: SalesData[], options: ExportOptions): Promise<Blob> {
    // For now, return CSV format - would implement actual Excel export with a library like xlsx
    return this.exportToCSV(data, options);
  }

  private async exportToPDF(data: SalesData[], options: ExportOptions): Promise<Blob> {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Sales Data Report', 20, 20);
    
    // Date range
    if (options.dateRange) {
      doc.setFontSize(12);
      doc.text(
        `Period: ${format(options.dateRange.start, 'MMM dd, yyyy')} - ${format(options.dateRange.end, 'MMM dd, yyyy')}`,
        20, 35
      );
    }

    // Summary statistics
    const totalSales = data.reduce((sum, sale) => sum + sale.grossSales, 0);
    const totalOrders = data.reduce((sum, sale) => sum + sale.orderCount, 0);
    const avgOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

    doc.text(`Total Records: ${data.length}`, 20, 50);
    doc.text(`Total Gross Sales: $${totalSales.toFixed(2)}`, 20, 60);
    doc.text(`Total Orders: ${totalOrders}`, 20, 70);
    doc.text(`Average Order Value: $${avgOrder.toFixed(2)}`, 20, 80);

    // Data table
    const tableData = data.map(sale => [
      sale.date,
      sale.location,
      `$${sale.grossSales.toFixed(2)}`,
      `$${sale.netSales.toFixed(2)}`,
      sale.orderCount.toString(),
      `$${sale.orderAverage.toFixed(2)}`
    ]);

    (doc as any).autoTable({
      head: [['Date', 'Location', 'Gross Sales', 'Net Sales', 'Orders', 'Avg Order']],
      body: tableData,
      startY: 95,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    return new Blob([doc.output('blob')], { type: 'application/pdf' });
  }

  private async exportToJSON(data: SalesData[], options: ExportOptions): Promise<Blob> {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        recordCount: data.length,
        dateRange: options.dateRange ? {
          start: options.dateRange.start.toISOString(),
          end: options.dateRange.end.toISOString()
        } : null,
        teamId: options.teamId || null
      },
      data: options.includeRawData ? data : data.map(sale => ({
        id: sale.id,
        date: sale.date,
        location: sale.location,
        team_id: sale.team_id,
        grossSales: sale.grossSales,
        netSales: sale.netSales,
        orderCount: sale.orderCount,
        orderAverage: sale.orderAverage
      }))
    };

    return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  }

  private async exportWeeklyToCSV(weeklyData: WeeklySalesData, options: ExportOptions): Promise<Blob> {
    const headers = [
      'Day', 'Date', 'Location', 'Gross Sales', 'Net Sales', 'Orders', 
      'Avg Order', 'Non Cash', 'Total Cash', 'Tips', 'Discounts', 'Taxes'
    ];

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const rows = days.map(day => {
      const dailySale = weeklyData.dailySales.find(sale => 
        format(new Date(sale.date), 'EEEE') === day
      );

      if (!dailySale) {
        return [day, '', weeklyData.location, '0', '0', '0', '0', '0', '0', '0', '0', '0'];
      }

      const discountTotal = dailySale.discounts.reduce((sum, d) => sum + d.total, 0);
      const taxTotal = dailySale.taxes.reduce((sum, t) => sum + t.total, 0);

      return [
        day,
        dailySale.date,
        dailySale.location,
        dailySale.grossSales.toFixed(2),
        dailySale.netSales.toFixed(2),
        dailySale.orderCount.toString(),
        dailySale.orderAverage.toFixed(2),
        dailySale.paymentBreakdown.nonCash.toFixed(2),
        dailySale.paymentBreakdown.totalCash.toFixed(2),
        dailySale.paymentBreakdown.tips.toFixed(2),
        discountTotal.toFixed(2),
        taxTotal.toFixed(2)
      ];
    });

    // Add totals row
    rows.push([
      'TOTAL',
      `${format(weeklyData.weekStart, 'MMM dd')} - ${format(weeklyData.weekEnd, 'MMM dd')}`,
      weeklyData.location,
      weeklyData.totals.grossTotal.toFixed(2),
      weeklyData.totals.netSales.toFixed(2),
      weeklyData.dailySales.reduce((sum, sale) => sum + sale.orderCount, 0).toString(),
      '',
      weeklyData.totals.nonCash.toFixed(2),
      weeklyData.totals.totalCash.toFixed(2),
      weeklyData.totals.tips.toFixed(2),
      weeklyData.totals.discount.toFixed(2),
      weeklyData.totals.taxPaid.toFixed(2)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  private async exportWeeklyToPDF(weeklyData: WeeklySalesData, options: ExportOptions): Promise<Blob> {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Weekly Sales Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Week: ${format(weeklyData.weekStart, 'MMM dd')} - ${format(weeklyData.weekEnd, 'MMM dd, yyyy')}`, 20, 35);
    doc.text(`Location: ${weeklyData.location}`, 20, 45);

    // Summary totals
    doc.setFontSize(14);
    doc.text('Weekly Summary', 20, 65);
    
    doc.setFontSize(11);
    const summaryY = 80;
    doc.text(`Gross Sales: $${weeklyData.totals.grossTotal.toFixed(2)}`, 20, summaryY);
    doc.text(`Net Sales: $${weeklyData.totals.netSales.toFixed(2)}`, 20, summaryY + 12);
    doc.text(`Total Cash: $${weeklyData.totals.totalCash.toFixed(2)}`, 20, summaryY + 24);
    doc.text(`Non-Cash: $${weeklyData.totals.nonCash.toFixed(2)}`, 20, summaryY + 36);
    doc.text(`Tips: $${weeklyData.totals.tips.toFixed(2)}`, 120, summaryY);
    doc.text(`Discounts: $${weeklyData.totals.discount.toFixed(2)}`, 120, summaryY + 12);
    doc.text(`Taxes: $${weeklyData.totals.taxPaid.toFixed(2)}`, 120, summaryY + 24);

    // Daily breakdown table
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const tableData = days.map(day => {
      const dailySale = weeklyData.dailySales.find(sale => 
        format(new Date(sale.date), 'EEEE') === day
      );

      if (!dailySale) {
        return [day, '-', '$0.00', '$0.00', '0'];
      }

      return [
        day,
        format(new Date(dailySale.date), 'MMM dd'),
        `$${dailySale.grossSales.toFixed(2)}`,
        `$${dailySale.netSales.toFixed(2)}`,
        dailySale.orderCount.toString()
      ];
    });

    (doc as any).autoTable({
      head: [['Day', 'Date', 'Gross Sales', 'Net Sales', 'Orders']],
      body: tableData,
      startY: 140,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [52, 152, 219] }
    });

    return new Blob([doc.output('blob')], { type: 'application/pdf' });
  }

  private async exportAnalyticsToPDF(
    kpiMetrics: KPIMetrics, 
    insights: PerformanceInsight[], 
    options: ExportOptions
  ): Promise<Blob> {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Analytics Report', 20, 20);
    
    if (options.dateRange) {
      doc.setFontSize(12);
      doc.text(
        `Period: ${format(options.dateRange.start, 'MMM dd, yyyy')} - ${format(options.dateRange.end, 'MMM dd, yyyy')}`,
        20, 35
      );
    }

    // KPI Metrics
    doc.setFontSize(16);
    doc.text('Key Performance Indicators', 20, 55);
    
    doc.setFontSize(11);
    let yPos = 70;
    doc.text(`Gross Sales: $${kpiMetrics.grossSales.toFixed(2)}`, 20, yPos);
    doc.text(`Change: ${kpiMetrics.periodComparison.grossSalesChange >= 0 ? '+' : ''}${kpiMetrics.periodComparison.grossSalesChange.toFixed(1)}%`, 120, yPos);
    
    yPos += 15;
    doc.text(`Net Sales: $${kpiMetrics.netSales.toFixed(2)}`, 20, yPos);
    doc.text(`Change: ${kpiMetrics.periodComparison.netSalesChange >= 0 ? '+' : ''}${kpiMetrics.periodComparison.netSalesChange.toFixed(1)}%`, 120, yPos);
    
    yPos += 15;
    doc.text(`Order Count: ${kpiMetrics.orderCount}`, 20, yPos);
    doc.text(`Change: ${kpiMetrics.periodComparison.orderCountChange >= 0 ? '+' : ''}${kpiMetrics.periodComparison.orderCountChange.toFixed(1)}%`, 120, yPos);
    
    yPos += 15;
    doc.text(`Average Order Value: $${kpiMetrics.averageOrderValue.toFixed(2)}`, 20, yPos);
    doc.text(`Change: ${kpiMetrics.periodComparison.averageOrderValueChange >= 0 ? '+' : ''}${kpiMetrics.periodComparison.averageOrderValueChange.toFixed(1)}%`, 120, yPos);
    
    yPos += 15;
    doc.text(`Labor Cost %: ${kpiMetrics.laborCostPercentage.toFixed(1)}%`, 20, yPos);

    // Performance Insights
    if (options.includeInsights && insights.length > 0) {
      yPos += 25;
      doc.setFontSize(16);
      doc.text('Performance Insights', 20, yPos);
      
      doc.setFontSize(10);
      yPos += 15;
      
      insights.forEach((insight, index) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 30;
        }
        
        doc.setFont(undefined, 'bold');
        doc.text(`${index + 1}. ${insight.title}`, 20, yPos);
        doc.setFont(undefined, 'normal');
        
        yPos += 8;
        const splitDescription = doc.splitTextToSize(insight.description, 170);
        doc.text(splitDescription, 25, yPos);
        yPos += splitDescription.length * 5 + 5;
      });
    }

    return new Blob([doc.output('blob')], { type: 'application/pdf' });
  }

  private async exportAnalyticsToJSON(
    kpiMetrics: KPIMetrics, 
    insights: PerformanceInsight[], 
    options: ExportOptions
  ): Promise<Blob> {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        dateRange: options.dateRange ? {
          start: options.dateRange.start.toISOString(),
          end: options.dateRange.end.toISOString()
        } : null,
        teamId: options.teamId || null
      },
      kpiMetrics,
      insights: options.includeInsights ? insights : []
    };

    return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  }

  // Utility method to trigger download
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

  // Generate filename based on export type and date
  generateFilename(type: string, format: string, dateRange?: { start: Date; end: Date }): string {
    const timestamp = format === 'json' ? new Date().toISOString().split('T')[0] : 
      new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    
    let filename = `${type}-${timestamp}`;
    
    if (dateRange) {
      const startStr = format(dateRange.start, 'yyyy-MM-dd');
      const endStr = format(dateRange.end, 'yyyy-MM-dd');
      filename = `${type}-${startStr}-to-${endStr}`;
    }
    
    return `${filename}.${format}`;
  }
}

export const exportService = new ExportService();