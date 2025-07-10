
// Development-specific logging utility that respects production environments
const isDevelopment = process.env.NODE_ENV === 'development';

export const devLog = {
  // Task operations - only in development
  taskOperation: (operation: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[TASK] ${operation}`, data);
    }
  },
  
  // User operations - only in development  
  userOperation: (operation: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[USER] ${operation}`, data);
    }
  },
  
  // Project operations - only in development
  projectOperation: (operation: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[PROJECT] ${operation}`, data);
    }
  },
  
  // Form operations - only in development
  formOperation: (operation: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[FORM] ${operation}`, data);
    }
  },
  
  // UI interactions - only in development
  uiOperation: (operation: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[UI] ${operation}`, data);
    }
  },
  
  // Navigation - only in development
  navigation: (operation: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[NAV] ${operation}`, data);
    }
  },
  
  // Debug info - only in development
  debug: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, data);
    }
  }
};
