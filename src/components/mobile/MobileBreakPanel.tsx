
import React from 'react';
import { Button } from '@/components/ui/button';
import { Coffee, UtensilsCrossed, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBreakPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBreak: (breakType: string) => void;
  isLoading?: boolean;
}

const MobileBreakPanel: React.FC<MobileBreakPanelProps> = ({
  isOpen,
  onClose,
  onStartBreak,
  isLoading = false
}) => {
  const breakTypes = [
    {
      type: 'Coffee',
      icon: Coffee,
      duration: '10 min',
      description: 'Quick coffee break',
      color: 'from-amber-500 to-orange-500',
      hoverColor: 'from-amber-600 to-orange-600'
    },
    {
      type: 'Lunch',
      icon: UtensilsCrossed,
      duration: '30 min',
      description: 'Lunch break',
      color: 'from-green-500 to-emerald-500',
      hoverColor: 'from-green-600 to-emerald-600'
    },
    {
      type: 'Rest',
      icon: Clock,
      duration: '15 min',
      description: 'Rest break',
      color: 'from-blue-500 to-cyan-500',
      hoverColor: 'from-blue-600 to-cyan-600'
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl border-t shadow-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        
        <div className="px-6 pb-safe-area-inset-bottom">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold">Take a Break</h3>
              <p className="text-sm text-muted-foreground">Choose your break type</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Break Options */}
          <div className="space-y-3 mb-6">
            {breakTypes.map((breakType) => {
              const IconComponent = breakType.icon;
              return (
                <Button
                  key={breakType.type}
                  onClick={() => onStartBreak(breakType.type)}
                  disabled={isLoading}
                  className={cn(
                    "w-full h-16 p-4 rounded-2xl border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
                    `bg-gradient-to-r ${breakType.color} hover:${breakType.hoverColor}`,
                    "text-white font-medium"
                  )}
                >
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <div className="flex items-center gap-4 w-full">
                      <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold">{breakType.type} Break</div>
                        <div className="text-sm opacity-90">{breakType.description}</div>
                      </div>
                      <div className="text-sm font-medium bg-white/20 px-3 py-1 rounded-lg">
                        {breakType.duration}
                      </div>
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
          
          {/* Legal Note */}
          <div className="text-xs text-muted-foreground text-center p-3 bg-muted/30 rounded-lg mb-4">
            <strong>CA Labor Law:</strong> You're entitled to breaks. Take care of yourself! 💚
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileBreakPanel;

