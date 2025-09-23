// Inventory quantity validation utilities

export interface QuantityValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface QuantityValues {
  inStockQuantity: number;
  minimumQuantity?: number;
  maximumQuantity?: number;
}

/**
 * Validates quantity logic according to database constraint:
 * - minimum_quantity <= in_stock_quantity <= maximum_quantity
 * - minimum_quantity <= maximum_quantity
 */
export const validateQuantityLogic = (values: QuantityValues): QuantityValidationResult => {
  const { inStockQuantity, minimumQuantity, maximumQuantity } = values;
  const errors: string[] = [];

  // Check minimum <= in_stock
  if (minimumQuantity !== undefined && minimumQuantity !== null && inStockQuantity < minimumQuantity) {
    errors.push(`In-stock quantity (${inStockQuantity}) must be at least the minimum quantity (${minimumQuantity})`);
  }

  // Check in_stock <= maximum
  if (maximumQuantity !== undefined && maximumQuantity !== null && inStockQuantity > maximumQuantity) {
    errors.push(`In-stock quantity (${inStockQuantity}) cannot exceed the maximum quantity (${maximumQuantity})`);
  }

  // Check minimum <= maximum
  if (
    minimumQuantity !== undefined && minimumQuantity !== null &&
    maximumQuantity !== undefined && maximumQuantity !== null &&
    minimumQuantity > maximumQuantity
  ) {
    errors.push(`Minimum quantity (${minimumQuantity}) cannot be greater than maximum quantity (${maximumQuantity})`);
  }

  // Check for negative values
  if (inStockQuantity < 0) {
    errors.push('In-stock quantity cannot be negative');
  }

  if (minimumQuantity !== undefined && minimumQuantity !== null && minimumQuantity < 0) {
    errors.push('Minimum quantity cannot be negative');
  }

  if (maximumQuantity !== undefined && maximumQuantity !== null && maximumQuantity < 0) {
    errors.push('Maximum quantity cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get safe default values for quick add operations
 */
export const getSafeQuickAddDefaults = (): QuantityValues => {
  return {
    inStockQuantity: 1, // Use 1 instead of 0 to avoid constraint issues
    minimumQuantity: undefined, // Leave null to satisfy constraint
    maximumQuantity: undefined, // Leave null to satisfy constraint
  };
};

/**
 * Parse constraint violation error and return user-friendly message
 */
export const parseQuantityConstraintError = (error: any): string => {
  const errorMessage = error.message || '';
  
  if (errorMessage.includes('check_quantity_logic')) {
    return 'The quantity values entered do not meet the required logic. Please ensure: minimum ≤ in-stock ≤ maximum, and all values are non-negative.';
  }
  
  if (errorMessage.includes('violates check constraint')) {
    return 'Invalid quantity combination. Please check that your minimum, in-stock, and maximum quantities follow proper logic.';
  }
  
  return errorMessage;
};