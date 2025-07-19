
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ModernSectionCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  gradient?: string;
  noPadding?: boolean;
}

const ModernSectionCard: React.FC<ModernSectionCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  children,
  className,
  headerAction,
  gradient = "from-primary/5 via-transparent to-accent/5",
  noPadding = false
}) => {
  return (
    <Card className={cn(
      "group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.01]",
      "bg-card",
      className
    )}>
      {/* Background gradient */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", gradient)} />
      
      <CardHeader className="relative pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 group-hover:scale-110 transition-transform">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          {headerAction && (
            <div className="flex-shrink-0">
              {headerAction}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className={cn("relative", noPadding && "p-0")}>
        {children}
      </CardContent>
      
      {/* Subtle shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
    </Card>
  );
};

export default ModernSectionCard;
