import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Upload, 
  Download, 
  RefreshCw, 
  Settings, 
  BarChart3, 
  FileText, 
  Calendar,
  Zap,
  X,
  HelpCircle
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';

interface FloatingAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  variant?: 'default' | 'secondary' | 'destructive';
  disabled?: boolean;
  badge?: string | number;
  quickAction?: boolean;
}

interface FloatingActionMenuProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  onUpload?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
  onCreateReport?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
  uploadProgress?: number;
  isRefreshing?: boolean;
  customActions?: FloatingAction[];
}

const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
  className,
  position = 'bottom-right',
  onUpload,
  onExport,
  onRefresh,
  onCreateReport,
  onSettings,
  onHelp,
  uploadProgress,
  isRefreshing = false,
  customActions = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const defaultActions: FloatingAction[] = [
    {
      id: 'upload',
      label: 'Upload Data',
      icon: uploadProgress !== undefined ? (
        <div className="relative">
          <Upload className="h-4 w-4" />
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          )}
        </div>
      ) : (
        <Upload className="h-4 w-4" />
      ),
      action: () => {
        onUpload?.();
        setIsOpen(false);
      },
      disabled: uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100,
      badge: uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100 ? 
        `${uploadProgress}%` : undefined,
      quickAction: true
    },
    {
      id: 'export',
      label: 'Export Report',
      icon: <Download className="h-4 w-4" />,
      action: () => {
        onExport?.();
        setIsOpen(false);
        toast({
          title: "Export Started",
          description: "Your report is being generated..."
        });
      },
      quickAction: true
    },
    {
      id: 'refresh',
      label: 'Refresh Data',
      icon: <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />,
      action: () => {
        onRefresh?.();
        setIsOpen(false);
      },
      disabled: isRefreshing,
      quickAction: true
    },
    {
      id: 'report',
      label: 'Create Report',
      icon: <FileText className="h-4 w-4" />,
      action: () => {
        onCreateReport?.();
        setIsOpen(false);
      }
    },
    {
      id: 'analytics',
      label: 'Quick Analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      action: () => {
        toast({
          title: "Analytics",
          description: "Opening analytics dashboard..."
        });
        setIsOpen(false);
      }
    },
    {
      id: 'schedule',
      label: 'Schedule Report',
      icon: <Calendar className="h-4 w-4" />,
      action: () => {
        toast({
          title: "Schedule Report",
          description: "Report scheduling coming soon!"
        });
        setIsOpen(false);
      }
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      action: () => {
        onSettings?.();
        setIsOpen(false);
      }
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: <HelpCircle className="h-4 w-4" />,
      action: () => {
        onHelp?.();
        setIsOpen(false);
      }
    }
  ].filter(action => {
    // Filter out actions where handler is not provided
    switch (action.id) {
      case 'upload': return !!onUpload;
      case 'export': return !!onExport;
      case 'refresh': return !!onRefresh;
      case 'report': return !!onCreateReport;
      case 'settings': return !!onSettings;
      case 'help': return !!onHelp;
      default: return true;
    }
  });

  const allActions = [...defaultActions, ...customActions];
  const quickActions = allActions.filter(action => action.quickAction);
  const regularActions = allActions.filter(action => !action.quickAction);

  const getPositionClasses = () => {
    const base = "fixed z-50";
    switch (position) {
      case 'bottom-right':
        return `${base} bottom-6 right-6`;
      case 'bottom-left':
        return `${base} bottom-6 left-6`;
      case 'top-right':
        return `${base} top-6 right-6`;
      case 'top-left':
        return `${base} top-6 left-6`;
      default:
        return `${base} bottom-6 right-6`;
    }
  };

  const handleMainButtonClick = () => {
    if (isMobile) {
      // On mobile, show all actions in expanded menu
      setIsOpen(!isOpen);
    } else {
      // On desktop, show only quick actions on hover/click
      setIsOpen(!isOpen);
    }
  };

  const renderAction = (action: FloatingAction, index: number) => (
    <div
      key={action.id}
      className="relative"
      onMouseEnter={() => !isMobile && setShowTooltip(action.id)}
      onMouseLeave={() => !isMobile && setShowTooltip(null)}
    >
      <Button
        size={isMobile ? 'sm' : 'default'}
        variant={action.variant || 'default'}
        onClick={action.action}
        disabled={action.disabled}
        className={cn(
          "relative shadow-lg",
          isMobile ? "w-full justify-start" : "w-12 h-12 rounded-full p-0",
          isOpen && !isMobile && "animate-in slide-in-from-bottom-2 duration-200",
        )}
        style={{
          animationDelay: !isMobile ? `${index * 50}ms` : undefined
        }}
      >
        {action.icon}
        {isMobile && <span className="ml-2">{action.label}</span>}
        {action.badge && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-auto min-w-[20px] px-1 text-xs"
          >
            {action.badge}
          </Badge>
        )}
      </Button>

      {/* Desktop Tooltip */}
      {!isMobile && showTooltip === action.id && (
        <Card className="absolute right-14 top-1/2 transform -translate-y-1/2 whitespace-nowrap z-60">
          <CardContent className="p-2">
            <p className="text-sm font-medium">{action.label}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className={cn(getPositionClasses(), className)}>
      {/* Mobile Expanded Menu */}
      {isMobile && isOpen && (
        <Card className="mb-4 w-48 shadow-xl">
          <CardContent className="p-2 space-y-1">
            {allActions.map((action, index) => renderAction(action, index))}
          </CardContent>
        </Card>
      )}

      {/* Desktop Action Stack */}
      {!isMobile && isOpen && (
        <div className="flex flex-col-reverse gap-3 mb-4">
          {quickActions.map((action, index) => renderAction(action, index))}
          
          {regularActions.length > 0 && (
            <div className="w-px h-4 bg-border mx-auto" />
          )}
          
          {regularActions.map((action, index) => renderAction(action, index + quickActions.length))}
        </div>
      )}

      {/* Main Action Button */}
      <Button
        size="lg"
        onClick={handleMainButtonClick}
        className={cn(
          "relative shadow-xl rounded-full w-14 h-14 p-0 transition-transform",
          isOpen && "rotate-45"
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        
        {/* Progress Ring for Upload */}
        {uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100 && (
          <div className="absolute inset-0 rounded-full">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="48%"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${uploadProgress * 2.83} 283`}
                className="opacity-20"
              />
            </svg>
          </div>
        )}
        
        {/* Quick Action Badge */}
        {!isOpen && (isRefreshing || (uploadProgress !== undefined && uploadProgress > 0)) && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
        )}
      </Button>

      {/* Auto-refresh indicator */}
      {isRefreshing && (
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          <Zap className="h-4 w-4 text-blue-500 animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default FloatingActionMenu;