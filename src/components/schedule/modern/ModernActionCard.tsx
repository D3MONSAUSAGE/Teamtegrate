import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface ModernActionCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  children: ReactNode;
}

export const ModernActionCard = ({ title, description, icon: Icon, children }: ModernActionCardProps) => {
  return (
    <div className="rounded-xl bg-gradient-to-br from-primary/5 via-accent/5 to-background p-6 border border-border/50 shadow-lg">
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-inner">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};
