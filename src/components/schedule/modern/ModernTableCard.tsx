import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ModernTableCardProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  actions?: ReactNode;
}

export const ModernTableCard = ({ title, icon: Icon, children, actions }: ModernTableCardProps) => {
  return (
    <Card className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              {title}
            </span>
          </CardTitle>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
};
