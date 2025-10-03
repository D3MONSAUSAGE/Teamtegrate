
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
      "group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300",
      "bg-card",
      className
    )}>
      {/* Background gradient */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", gradient)} />
      
      <CardHeader className="relative pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
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
      
      <CardContent className={cn("relative", noPadding && "p-0", !noPadding && "px-4 pb-4")}>
        {children}
      </CardContent>
    </Card>
  );
};

export default ModernSectionCard;
