import { toast } from '@/components/ui/sonner';

/**
 * Enhanced toast notifications with consistent styling
 * This is a temporary utility that will be fully replaced by the centralized notification system
 */
export const enhancedNotifications = {
  success: (message: string, options?: any) => {
    toast.success(message, {
      duration: 4000,
      style: {
        background: 'hsl(var(--success))',
        color: 'hsl(var(--success-foreground))',
        border: '1px solid hsl(var(--success))'
      },
      ...options
    });
  },

  error: (message: string, options?: any) => {
    toast.error(message, {
      duration: 6000,
      style: {
        background: 'hsl(var(--destructive))',
        color: 'hsl(var(--destructive-foreground))',
        border: '1px solid hsl(var(--destructive))'
      },
      ...options
    });
  },

  warning: (message: string, options?: any) => {
    toast.warning(message, {
      duration: 5000,
      style: {
        background: 'hsl(var(--warning))',
        color: 'hsl(var(--warning-foreground))',
        border: '1px solid hsl(var(--warning))'
      },
      ...options
    });
  },

  info: (message: string, options?: any) => {
    toast(message, {
      duration: 4000,
      style: {
        background: 'hsl(var(--card))',
        color: 'hsl(var(--card-foreground))',
        border: '1px solid hsl(var(--border))'
      },
      ...options
    });
  }
};