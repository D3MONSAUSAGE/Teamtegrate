import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DailyFinancialMetrics } from '@/hooks/useDailyFinancialAnalytics';
import { formatCurrency } from './formatters';

interface DailyReportOptions {
  metrics: DailyFinancialMetrics;
  date: Date;
  teamName?: string;
  timezone: string;
}

export const generateDailyReportPDF = (options: DailyReportOptions): void => {
  const { metrics, date, teamName, timezone } = options;
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Daily Financial Report', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }), pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 6;
  if (teamName) {
    doc.text(`Team: ${teamName}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
  }
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Timezone: ${timezone}`, pageWidth / 2, yPos, { align: 'center' });
  doc.setTextColor(0);
  
  yPos += 15;

  // Financial Summary Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Summary', 14, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: [
      ['Total Revenue', formatCurrency(metrics.totalRevenue)],
      ['Total Transactions', metrics.totalTransactions.toString()],
      ['Average Ticket', formatCurrency(metrics.averageTicket)],
      ['Total COGS', formatCurrency(metrics.totalCOGS)],
      ['Gross Profit', formatCurrency(metrics.grossProfit)],
      ['Profit Margin', `${metrics.profitMargin.toFixed(1)}%`],
      ['Total Incoming', formatCurrency(metrics.totalIncoming)],
      ['Total Outgoing', formatCurrency(metrics.totalOutgoing)]
    ],
    theme: 'grid',
    headStyles: { fillColor: [66, 66, 66], fontStyle: 'bold' },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { cellWidth: 'auto', halign: 'right' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Detailed Transactions Section
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Transactions', 14, yPos);
  yPos += 8;

  const transactionRows = metrics.transactions.map(t => [
    t.time,
    t.reference_number,
    t.item_name,
    t.quantity.toString(),
    formatCurrency(t.unit_cost),
    formatCurrency(t.sale_price),
    formatCurrency(t.revenue),
    formatCurrency(t.profit)
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Time', 'Invoice #', 'Item', 'Qty', 'Cost', 'Price', 'Revenue', 'Profit']],
    body: transactionRows,
    theme: 'striped',
    headStyles: { fillColor: [66, 66, 66], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 25 },
      2: { cellWidth: 45 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 22, halign: 'right' }
    },
    didParseCell: (data) => {
      // Highlight profit column - green if positive, red if negative
      if (data.column.index === 7 && data.section === 'body') {
        const profit = parseFloat(transactionRows[data.row.index][7].replace(/[$,]/g, ''));
        if (profit < 0) {
          data.cell.styles.textColor = [220, 38, 38];
        } else if (profit > 0) {
          data.cell.styles.textColor = [22, 163, 74];
        }
      }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Top Selling Items Section
  if (metrics.topSellingItems.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Selling Items (Top 10)', 14, yPos);
    yPos += 8;

    const topItemsRows = metrics.topSellingItems.slice(0, 10).map((item, index) => [
      (index + 1).toString(),
      item.name,
      item.quantity.toString(),
      formatCurrency(item.revenue),
      formatCurrency(item.profit)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Rank', 'Item Name', 'Qty Sold', 'Revenue', 'Profit']],
      body: topItemsRows,
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66], fontStyle: 'bold' },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 80 },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Generated: ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  const filename = `Daily_Report_${date.toISOString().split('T')[0]}${teamName ? `_${teamName.replace(/\s+/g, '_')}` : ''}.pdf`;
  doc.save(filename);
};
