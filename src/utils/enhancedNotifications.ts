
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Info, XCircle, Undo } from 'lucide-react';

export interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export interface EnhancedNotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
  actions?: NotificationAction[];
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
}

export const enhancedNotifications = {
  success: (message: string, options: EnhancedNotificationOptions = {}) => {
    return toast.success(options.title || message, {
      description: options.description,
      duration: options.duration || 4000,
      action: options.actions?.length ? (
        <div className="flex gap-2">
          {options.actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'default'}
              size="sm"
              onClick={() => {
                action.onClick();
                toast.dismiss();
              }}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : undefined,
      icon: <CheckCircle className="h-4 w-4" />
    });
  },

  error: (message: string, options: EnhancedNotificationOptions = {}) => {
    return toast.error(options.title || message, {
      description: options.description,
      duration: options.duration || 6000,
      action: options.actions?.length ? (
        <div className="flex gap-2">
          {options.actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'destructive'}
              size="sm"
              onClick={() => {
                action.onClick();
                toast.dismiss();
              }}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : undefined,
      icon: <XCircle className="h-4 w-4" />
    });
  },

  warning: (message: string, options: EnhancedNotificationOptions = {}) => {
    return toast.warning(options.title || message, {
      description: options.description,
      duration: options.duration || 5000,
      action: options.actions?.length ? (
        <div className="flex gap-2">
          {options.actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={() => {
                action.onClick();
                toast.dismiss();
              }}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : undefined,
      icon: <AlertCircle className="h-4 w-4" />
    });
  },

  info: (message: string, options: EnhancedNotificationOptions = {}) => {
    return toast.info(options.title || message, {
      description: options.description,
      duration: options.duration || 4000,
      action: options.actions?.length ? (
        <div className="flex gap-2">
          {options.actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'secondary'}
              size="sm"
              onClick={() => {
                action.onClick();
                toast.dismiss();
              }}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : undefined,
      icon: <Info className="h-4 w-4" />
    });
  },

  undo: (message: string, onUndo: () => void, options: Omit<EnhancedNotificationOptions, 'actions'> = {}) => {
    return toast.success(options.title || message, {
      description: options.description,
      duration: options.duration || 8000,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onUndo();
            toast.dismiss();
          }}
          className="flex items-center gap-1"
        >
          <Undo className="h-3 w-3" />
          Undo
        </Button>
      ),
      icon: <CheckCircle className="h-4 w-4" />
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      duration: 4000
    });
  }
};
