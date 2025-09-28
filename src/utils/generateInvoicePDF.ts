import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { CreatedInvoice } from '@/types/invoices';
import { format } from 'date-fns';

export const generateInvoicePDF = (invoice: CreatedInvoice): void => {
  try {
    const doc = new jsPDF();
  
  // Company header
  doc.setFontSize(20);
  doc.setTextColor(60, 60, 60);
  doc.text('INVOICE', 20, 30);
  
  // Invoice number and date
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Invoice #: ${invoice.invoice_number}`, 120, 30);
  doc.text(`Issue Date: ${format(new Date(invoice.issue_date), 'MMM dd, yyyy')}`, 120, 40);
  doc.text(`Due Date: ${format(new Date(invoice.due_date), 'MMM dd, yyyy')}`, 120, 50);
  
  // Bill to section
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text('Bill To:', 20, 70);
  
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  let yPos = 80;
  
  if (invoice.client) {
    doc.text(invoice.client.name, 20, yPos);
    yPos += 10;
    
    if (invoice.client.email) {
      doc.text(invoice.client.email, 20, yPos);
      yPos += 10;
    }
    
    if (invoice.client.phone) {
      doc.text(invoice.client.phone, 20, yPos);
      yPos += 10;
    }
    
    if (invoice.client.address) {
      doc.text(invoice.client.address, 20, yPos);
      yPos += 10;
    }
    
    if (invoice.client.city && invoice.client.state) {
      doc.text(`${invoice.client.city}, ${invoice.client.state} ${invoice.client.postal_code || ''}`, 20, yPos);
      yPos += 10;
    }
  }
  
  // Line items table
  const tableData = invoice.line_items?.map(item => [
    item.description,
    item.quantity.toString(),
    `$${item.unit_price.toFixed(2)}`,
    `$${item.total_price.toFixed(2)}`
  ]) || [];
  
  doc.autoTable({
    head: [['Description', 'Quantity', 'Unit Price', 'Total']],
    body: tableData,
    startY: yPos + 10,
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });
  
  // Calculate totals position
  const finalY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 20 : yPos + 50;
  
  // Totals section
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  
  const totalsX = 140;
  doc.text('Subtotal:', totalsX, finalY);
  doc.text(`$${invoice.subtotal.toFixed(2)}`, totalsX + 40, finalY);
  
  doc.text('Tax:', totalsX, finalY + 10);
  doc.text(`$${invoice.tax_amount.toFixed(2)}`, totalsX + 40, finalY + 10);
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Total:', totalsX, finalY + 25);
  doc.text(`$${invoice.total_amount.toFixed(2)}`, totalsX + 40, finalY + 25);
  
  // Payment terms and notes
  if (invoice.payment_terms || invoice.notes) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    
    let notesY = finalY + 45;
    
    if (invoice.payment_terms) {
      doc.text(`Payment Terms: ${invoice.payment_terms}`, 20, notesY);
      notesY += 10;
    }
    
    if (invoice.notes) {
      doc.text(`Notes: ${invoice.notes}`, 20, notesY);
    }
  }
  
  // Footer text
  if (invoice.footer_text) {
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(invoice.footer_text, 20, 280);
  }
  
    // Save the PDF
    doc.save(`${invoice.invoice_number}.pdf`);
  } catch (error) {
    console.error('PDF generation failed:', error);
    // Fallback: show error but don't prevent checkout completion
    throw new Error('PDF generation failed. Invoice was created successfully but PDF could not be generated.');
  }
};