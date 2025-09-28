import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

export type BarcodeFormat = 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC' | 'ITF14' | 'MSI' | 'pharmacode' | 'codabar';

export interface BarcodeOptions {
  format?: BarcodeFormat;
  width?: number;
  height?: number;
  displayValue?: boolean;
  text?: string;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  textPosition?: 'bottom' | 'top';
  textMargin?: number;
  background?: string;
  lineColor?: string;
  margin?: number;
}

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'low' | 'medium' | 'quartile' | 'high';
}

export class BarcodeGenerator {
  static generateBarcode(value: string, options: BarcodeOptions = {}): string {
    const canvas = document.createElement('canvas');
    
    try {
      JsBarcode(canvas, value, {
        format: options.format || 'CODE128',
        width: options.width || 2,
        height: options.height || 100,
        displayValue: options.displayValue !== false,
        text: options.text || value,
        fontSize: options.fontSize || 20,
        textAlign: options.textAlign || 'center',
        textPosition: options.textPosition || 'bottom',
        textMargin: options.textMargin || 2,
        background: options.background || '#ffffff',
        lineColor: options.lineColor || '#000000',
        margin: options.margin || 10,
      });
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating barcode:', error);
      return '';
    }
  }

  static async generateQRCode(value: string, options: QRCodeOptions = {}): Promise<string> {
    try {
      return await QRCode.toDataURL(value, {
        width: options.width || 200,
        margin: options.margin || 4,
        color: {
          dark: options.color?.dark || '#000000',
          light: options.color?.light || '#ffffff',
        },
        errorCorrectionLevel: options.errorCorrectionLevel || 'medium',
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  }

  static validateBarcodeValue(value: string, format: BarcodeFormat = 'CODE128'): boolean {
    if (!value || value.trim() === '') return false;
    
    switch (format) {
      case 'CODE128':
        return /^[\x00-\x7F]*$/.test(value); // ASCII characters only
      case 'CODE39':
        return /^[A-Z0-9\-. $/+%]*$/.test(value); // CODE39 valid characters
      case 'EAN13':
        return /^\d{12,13}$/.test(value); // 12-13 digits
      case 'EAN8':
        return /^\d{7,8}$/.test(value); // 7-8 digits
      case 'UPC':
        return /^\d{11,12}$/.test(value); // 11-12 digits
      default:
        return true; // Assume valid for other formats
    }
  }

  static generateRandomSKU(prefix: string = 'SKU'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}${random}`.toUpperCase();
  }

  static generateLotNumber(prefix: string = 'LOT'): string {
    const date = new Date();
    const year = date.getFullYear().toString().substring(2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${year}${month}${day}${random}`;
  }

  static createLabelPDF(
    content: { type: 'text' | 'barcode' | 'qr' | 'nutritional_facts' | 'ingredients_list' | 'allergen_warning' | 'lot_expiration' | 'multiline_text'; value: string; x: number; y: number; options?: any }[],
    dimensions: { width: number; height: number } = { width: 2, height: 1 }
  ): jsPDF {
    // Convert inches to points (1 inch = 72 points)
    const width = dimensions.width * 72;
    const height = dimensions.height * 72;
    
    const pdf = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [width, height]
    });

    content.forEach(item => {
      switch (item.type) {
        case 'text':
          pdf.setFontSize(item.options?.fontSize || 12);
          pdf.text(item.value, item.x, item.y);
          break;
          
        case 'barcode':
          const barcodeImg = this.generateBarcode(item.value, item.options);
          if (barcodeImg) {
            pdf.addImage(barcodeImg, 'PNG', item.x, item.y, item.options?.width || 100, item.options?.height || 30);
          }
          break;
          
        case 'qr':
          this.generateQRCode(item.value, item.options).then(qrImg => {
            if (qrImg) {
              pdf.addImage(qrImg, 'PNG', item.x, item.y, item.options?.size || 40, item.options?.size || 40);
            }
          });
          break;
          
        case 'nutritional_facts':
          this.renderNutritionalFacts(pdf, item.value, item.x, item.y, item.options);
          break;
          
        case 'ingredients_list':
          this.renderIngredientsWithWordWrap(pdf, item.value, item.x, item.y, item.options);
          break;
          
        case 'allergen_warning':
          this.renderAllergenWarning(pdf, item.value, item.x, item.y, item.options);
          break;
          
        case 'lot_expiration':
          this.renderLotExpiration(pdf, item.value, item.x, item.y, item.options);
          break;
          
        case 'multiline_text':
          this.renderMultilineText(pdf, item.value, item.x, item.y, item.options);
          break;
      }
    });

    return pdf;
  }

  static generateZPLCode(
    content: { type: 'text' | 'barcode' | 'qr' | 'nutritional_facts' | 'ingredients_list' | 'allergen_warning' | 'lot_expiration' | 'multiline_text'; value: string; x: number; y: number; options?: any }[],
    dimensions: { width: number; height: number } = { width: 2, height: 1 }
  ): string {
    // Convert inches to dots (203 DPI for most Zebra printers)
    const width = Math.round(dimensions.width * 203);
    const height = Math.round(dimensions.height * 203);
    
    let zpl = `^XA^FO0,0^GB${width},${height},2^FS`; // Draw border
    
    content.forEach(item => {
      const x = Math.round(item.x * 203 / 72); // Convert points to dots
      const y = Math.round(item.y * 203 / 72);
      
      switch (item.type) {
        case 'text':
          const fontSize = item.options?.fontSize || 12;
          const fontCode = fontSize > 14 ? '^A0' : '^AS'; // Choose font size
          zpl += `^FO${x},${y}${fontCode}N,${Math.round(fontSize * 2)}^FD${item.value}^FS`;
          break;
          
        case 'barcode':
          const format = item.options?.format || 'CODE128';
          const barcodeHeight = Math.round((item.options?.height || 30) * 203 / 72);
          let zplFormat = '^BCN'; // Default to CODE128
          
          switch (format) {
            case 'CODE39':
              zplFormat = '^B3N';
              break;
            case 'EAN13':
              zplFormat = '^BEN';
              break;
            case 'QR':
              zplFormat = '^BQN';
              break;
          }
          
          zpl += `^FO${x},${y}${zplFormat},${barcodeHeight},Y,N,N^FD${item.value}^FS`;
          break;
          
        case 'qr':
          const qrSize = Math.round((item.options?.size || 40) * 203 / 72);
          zpl += `^FO${x},${y}^BQN,2,${Math.round(qrSize/10)}^FDQA,${item.value}^FS`;
          break;
      }
    });
    
    zpl += '^XZ'; // End ZPL command
    return zpl;
  }

  // New methods for enhanced field types
  static renderNutritionalFacts(pdf: jsPDF, nutritionalData: string, x: number, y: number, options: any = {}) {
    try {
      const data = JSON.parse(nutritionalData);
      const fontSize = options.fontSize || 8;
      const lineHeight = options.lineHeight || fontSize + 2;
      let currentY = y;

      pdf.setFontSize(fontSize + 1);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Nutrition Facts', x, currentY);
      currentY += lineHeight + 2;

      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', 'normal');
      
      if (data.servingSize) {
        pdf.text(`Serving Size: ${data.servingSize}`, x, currentY);
        currentY += lineHeight;
      }
      
      if (data.calories !== null && data.calories !== undefined) {
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Calories: ${data.calories}`, x, currentY);
        pdf.setFont('helvetica', 'normal');
        currentY += lineHeight + 1;
      }

      const nutrients = [
        { label: 'Total Fat', value: data.totalFat, unit: 'g' },
        { label: 'Sodium', value: data.sodium, unit: 'mg' },
        { label: 'Total Carbs', value: data.totalCarbs, unit: 'g' },
        { label: 'Protein', value: data.protein, unit: 'g' }
      ];

      nutrients.forEach(nutrient => {
        if (nutrient.value !== null && nutrient.value !== undefined) {
          pdf.text(`${nutrient.label}: ${nutrient.value}${nutrient.unit}`, x, currentY);
          currentY += lineHeight;
        }
      });
    } catch (error) {
      pdf.setFontSize(options.fontSize || 8);
      pdf.text('Nutritional Facts', x, y);
    }
  }

  static renderIngredientsWithWordWrap(pdf: jsPDF, ingredients: string, x: number, y: number, options: any = {}) {
    const fontSize = options.fontSize || 7;
    const maxWidth = options.width || 150;
    const lineHeight = options.lineHeight || fontSize + 1;
    
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INGREDIENTS:', x, y);
    
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(`${ingredients}`, maxWidth);
    pdf.text(lines, x, y + lineHeight);
  }

  static renderAllergenWarning(pdf: jsPDF, allergens: string, x: number, y: number, options: any = {}) {
    const fontSize = options.fontSize || 7;
    const lineHeight = options.lineHeight || fontSize + 2;
    
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ALLERGEN WARNING:', x, y);
    
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Contains: ${allergens}`, x, y + lineHeight);
  }

  static renderLotExpiration(pdf: jsPDF, lotData: string, x: number, y: number, options: any = {}) {
    try {
      const data = JSON.parse(lotData);
      const fontSize = options.fontSize || 8;
      const lineHeight = options.lineHeight || fontSize + 2;
      
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', 'bold');
      
      if (data.lotNumber) {
        pdf.text(`LOT: ${data.lotNumber}`, x, y);
      }
      
      if (data.expirationDate) {
        const formattedDate = new Date(data.expirationDate).toLocaleDateString();
        pdf.text(`EXP: ${formattedDate}`, x, y + lineHeight);
      }
    } catch (error) {
      pdf.setFontSize(options.fontSize || 8);
      pdf.text(lotData, x, y);
    }
  }

  static renderMultilineText(pdf: jsPDF, text: string, x: number, y: number, options: any = {}) {
    const fontSize = options.fontSize || 8;
    const maxWidth = options.width || 120;
    const lineHeight = options.lineHeight || fontSize + 1;
    
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', options.fontWeight === 'bold' ? 'bold' : 'normal');
    
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
  }

  // Thermal printer optimized dimensions (common sizes)
  static getThermalDimensions(size: string = '4x6') {
    const thermalSizes = {
      '4x6': { width: 4, height: 6 }, // Standard shipping/food label
      '4x3': { width: 4, height: 3 }, // Compact food label
      '2x1': { width: 2, height: 1 }, // Small product label
      '3x2': { width: 3, height: 2 }, // Medium product label
      '4x2': { width: 4, height: 2 }  // Wide food label
    };
    return thermalSizes[size as keyof typeof thermalSizes] || thermalSizes['4x6'];
  }
}