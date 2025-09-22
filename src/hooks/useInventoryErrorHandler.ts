import { useCallback } from 'react';
import { toast } from 'sonner';

export interface InventoryError {
  code?: string;
  message: string;
  details?: any;
}

export const useInventoryErrorHandler = () => {
  const handleError = useCallback((error: any, context: string): InventoryError => {
    console.error(`Inventory Error [${context}]:`, error);
    
    let userMessage = 'An unexpected error occurred';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error?.message) {
      // Parse common Supabase errors
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        userMessage = 'Database schema mismatch detected. Please contact support.';
        errorCode = 'SCHEMA_ERROR';
      } else if (error.message.includes('violates row-level security')) {
        userMessage = 'You do not have permission to perform this action.';
        errorCode = 'PERMISSION_ERROR';
      } else if (error.message.includes('Unable to update inventory count')) {
        userMessage = error.message; // Use the improved message from the API
        errorCode = 'RLS_POLICY_ERROR';
      } else if (error.message.includes('JSON object requested, multiple (or no) rows returned')) {
        userMessage = 'Unable to complete the operation. This may be due to insufficient permissions or the record may no longer exist.';
        errorCode = 'RLS_ACCESS_ERROR';
      } else if (error.message.includes('duplicate key')) {
        userMessage = 'This item already exists. Please use a different name or SKU.';
        errorCode = 'DUPLICATE_ERROR';
      } else if (error.message.includes('foreign key')) {
        userMessage = 'Cannot perform this action due to related data dependencies.';
        errorCode = 'DEPENDENCY_ERROR';
      } else if (error.message.includes('connection')) {
        userMessage = 'Network connection error. Please try again.';
        errorCode = 'NETWORK_ERROR';
      } else {
        userMessage = error.message;
        errorCode = 'API_ERROR';
      }
    }
    
    const inventoryError: InventoryError = {
      code: errorCode,
      message: userMessage,
      details: error
    };
    
    // Show user-friendly toast notification
    toast.error(`${context}: ${userMessage}`);
    
    return inventoryError;
  }, []);
  
  const handleAsyncOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    context: string,
    successMessage?: string
  ): Promise<T | null> => {
    try {
      const result = await operation();
      if (successMessage) {
        toast.success(successMessage);
      }
      return result;
    } catch (error) {
      handleError(error, context);
      return null;
    }
  }, [handleError]);
  
  return {
    handleError,
    handleAsyncOperation
  };
};