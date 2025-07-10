
// Development logging utility to reduce console noise
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  },

  // For user actions that we always want to track
  userAction: (action: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[USER_ACTION] ${action}`, data);
    }
  }
};
