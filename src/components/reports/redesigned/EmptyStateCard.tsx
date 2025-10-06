import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileQuestion, PlusCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateCardProps {
  title: string;
  description: string;
  icon?: 'alert' | 'question' | 'plus' | 'chart';
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  title,
  description,
  icon = 'question',
  actionLabel,
  onAction,
  className
}) => {
  const getIcon = () => {
    const iconClass = "h-12 w-12 text-muted-foreground/50";
    switch (icon) {
      case 'alert': return <AlertCircle className={iconClass} />;
      case 'plus': return <PlusCircle className={iconClass} />;
      case 'chart': return <TrendingUp className={iconClass} />;
      default: return <FileQuestion className={iconClass} />;
    }
  };

  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="rounded-full bg-muted/50 p-4 mb-4">
          {getIcon()}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {description}
        </p>
        {actionLabel && onAction && (
          <Button onClick={onAction} variant="outline" size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};