import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CreatedInvoice } from '@/types/invoices';
import { format } from 'date-fns';

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.error('Failed to load image:', url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });
};

export const generateInvoicePDF = async (invoice: CreatedInvoice): Promise<void> => {
  try {
    const doc = new jsPDF();
    let yPos = 20;
  
    // Company logo and header
    if (invoice.company_logo_url) {
      try {
        const logoImg = await loadImage(invoice.company_logo_url);
        doc.addImage(logoImg, 'PNG', 20, yPos, 35, 35);
      } catch (error) {
        console.error('Failed to add logo to PDF:', error);
        // Continue without logo
      }
    }

    // Company information
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(invoice.company_name || 'Company Name', invoice.company_logo_url ? 60 : 20, yPos + 8);
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    let companyYPos = yPos + 16;
    
    if (invoice.company_address) {
      doc.text(invoice.company_address, invoice.company_logo_url ? 60 : 20, companyYPos);
      companyYPos += 5;
    }
    if (invoice.company_phone) {
      doc.text(`Phone: ${invoice.company_phone}`, invoice.company_logo_url ? 60 : 20, companyYPos);
      companyYPos += 5;
    }
    if (invoice.company_email) {
      doc.text(`Email: ${invoice.company_email}`, invoice.company_logo_url ? 60 : 20, companyYPos);
    }

    // INVOICE title and details (right side)
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(66, 139, 202);
    doc.text('INVOICE', 200, yPos + 10, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Invoice #: ${invoice.invoice_number}`, 200, yPos + 20, { align: 'right' });
    doc.text(`Issue Date: ${format(new Date(invoice.issue_date), 'MMM dd, yyyy')}`, 200, yPos + 27, { align: 'right' });
    doc.text(`Due Date: ${format(new Date(invoice.due_date), 'MMM dd, yyyy')}`, 200, yPos + 34, { align: 'right' });

    yPos = 65;
  
    // Bill to section
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(66, 139, 202);
    doc.text('BILL TO:', 20, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(60, 60, 60);
    
    if (invoice.client) {
      doc.setFont(undefined, 'bold');
      doc.text(invoice.client.name, 20, yPos);
      yPos += 6;
      
      doc.setFont(undefined, 'normal');
      if (invoice.client.email) {
        doc.text(invoice.client.email, 20, yPos);
        yPos += 5;
      }
      
      if (invoice.client.phone) {
        doc.text(invoice.client.phone, 20, yPos);
        yPos += 5;
      }
      
      if (invoice.client.address) {
        doc.text(invoice.client.address, 20, yPos);
        yPos += 5;
      }
      
      if (invoice.client.city && invoice.client.state) {
        doc.text(`${invoice.client.city}, ${invoice.client.state} ${invoice.client.postal_code || ''}`, 20, yPos);
        yPos += 5;
      }
    }
    
    yPos += 5;
  
    // Line items table
    const tableData = invoice.line_items?.map(item => [
      item.description,
      item.quantity.toString(),
      `$${item.unit_price.toFixed(2)}`,
      `$${item.total_price.toFixed(2)}`
    ]) || [];
    
    autoTable(doc, {
      head: [['Description', 'Quantity', 'Unit Price', 'Total']],
      body: tableData,
      startY: yPos,
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
      },
    });
  
    // Calculate totals position
    const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 15 : yPos + 50;
    
    // Totals section
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80, 80, 80);
    
    const totalsX = 145;
    const amountX = 185;
    
    doc.text('Subtotal:', totalsX, finalY);
    doc.text(`$${invoice.subtotal.toFixed(2)}`, amountX, finalY, { align: 'right' });
    
    doc.text('Tax:', totalsX, finalY + 8);
    doc.text(`$${invoice.tax_amount.toFixed(2)}`, amountX, finalY + 8, { align: 'right' });
    
    // Draw line above total
    doc.setDrawColor(200, 200, 200);
    doc.line(totalsX, finalY + 12, amountX, finalY + 12);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(66, 139, 202);
    doc.text('Total:', totalsX, finalY + 20);
    doc.text(`$${invoice.total_amount.toFixed(2)}`, amountX, finalY + 20, { align: 'right' });
  
    // Payment terms and notes
    if (invoice.payment_terms || invoice.notes) {
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      
      let notesY = finalY + 35;
      
      if (invoice.payment_terms) {
        doc.setFont(undefined, 'bold');
        doc.text('Payment Terms:', 20, notesY);
        doc.setFont(undefined, 'normal');
        doc.text(invoice.payment_terms, 55, notesY);
        notesY += 8;
      }
      
      if (invoice.notes) {
        doc.setFont(undefined, 'bold');
        doc.text('Notes:', 20, notesY);
        doc.setFont(undefined, 'normal');
        const splitNotes = doc.splitTextToSize(invoice.notes, 170);
        doc.text(splitNotes, 20, notesY + 6);
      }
    }
    
    // Footer text
    if (invoice.footer_text) {
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const footerY = 280;
      const splitFooter = doc.splitTextToSize(invoice.footer_text, 170);
      doc.text(splitFooter, 105, footerY, { align: 'center' });
    }
    
    // Save the PDF
    doc.save(`${invoice.invoice_number}.pdf`);
  } catch (error) {
    console.error('PDF generation failed:', error);
    // Fallback: show error but don't prevent checkout completion
    throw new Error('PDF generation failed. Invoice was created successfully but PDF could not be generated.');
  }
};