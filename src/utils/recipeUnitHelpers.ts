export interface ParsedPackaging {
  quantity: number;
  unit: string;
  price?: number;
}

/**
 * Parse packaging info string like "16oz @ $12.60" or "case of 12"
 */
export function parsePackagingInfo(packagingInfo?: string | null): ParsedPackaging | null {
  if (!packagingInfo) return null;
  
  // Match patterns like "16oz @ $12.60" or "case of 12 @ $45"
  const patterns = [
    /(\d+\.?\d*)\s*([a-zA-Z]+)\s*@\s*\$?(\d+\.?\d*)/,  // "16oz @ $12.60"
    /(\d+\.?\d*)\s*([a-zA-Z]+)/,                       // "16oz"
    /case of (\d+)/i,                                   // "case of 12"
  ];
  
  for (const pattern of patterns) {
    const match = packagingInfo.match(pattern);
    if (match) {
      if (pattern.source.includes('case of')) {
        return {
          quantity: parseFloat(match[1]),
          unit: 'case',
          price: undefined,
        };
      } else {
        return {
          quantity: parseFloat(match[1]),
          unit: match[2],
          price: match[3] ? parseFloat(match[3]) : undefined,
        };
      }
    }
  }
  
  return null;
}

/**
 * Calculate the display quantity in purchase units
 */
export function calculateDisplayQuantity(
  quantityNeeded: number,
  conversionFactor?: number | null,
  packaging?: ParsedPackaging | null
): { quantity: number; unit: string } {
  // If we have conversion factor and packaging info, calculate purchase quantity
  if (conversionFactor && packaging) {
    const purchaseQuantity = quantityNeeded * conversionFactor;
    return {
      quantity: purchaseQuantity,
      unit: packaging.unit,
    };
  }
  
  // Fallback: return original quantity with generic unit
  return {
    quantity: quantityNeeded,
    unit: 'unit',
  };
}

/**
 * Format quantity for display (handles decimals nicely)
 */
export function formatQuantity(quantity: number, decimals: number = 2): string {
  // Round to specified decimals
  const rounded = Number(quantity.toFixed(decimals));
  
  // Remove unnecessary trailing zeros
  return rounded.toString().replace(/\.?0+$/, '');
}
