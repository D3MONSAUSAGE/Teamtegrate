
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MobileTableProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileTableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface MobileTableCellProps {
  children: React.ReactNode;
  className?: string;
  label?: string; // For mobile card view
  isHeader?: boolean;
}

export const MobileTable: React.FC<MobileTableProps> = ({ children, className }) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <div className={cn("space-y-3", className)}>
        {children}
      </div>
    );
  }
  
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        {children}
      </table>
    </div>
  );
};

export const MobileTableHeader: React.FC<MobileTableProps> = ({ children, className }) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return null; // Hide headers on mobile since we use cards
  }
  
  return (
    <thead className={cn("border-b", className)}>
      {children}
    </thead>
  );
};

export const MobileTableBody: React.FC<MobileTableProps> = ({ children, className }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(isMobile ? "space-y-3" : "", className)}>
      {children}
    </div>
  );
};

export const MobileTableRow: React.FC<MobileTableRowProps> = ({ children, className, onClick }) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <Card 
        className={cn(
          "mobile-touch-target cursor-pointer hover:shadow-md transition-shadow",
          onClick && "active:scale-98",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="space-y-2">
            {children}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <tr 
      className={cn(
        "border-b hover:bg-muted/50 transition-colors",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

export const MobileTableCell: React.FC<MobileTableCellProps> = ({ 
  children, 
  className, 
  label,
  isHeader = false 
}) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    if (isHeader) return null; // Headers are hidden on mobile
    
    return (
      <div className={cn("flex justify-between items-center", className)}>
        {label && (
          <span className="text-sm font-medium text-muted-foreground mobile-text-sm">
            {label}:
          </span>
        )}
        <div className="text-sm mobile-text-base">
          {children}
        </div>
      </div>
    );
  }
  
  if (isHeader) {
    return (
      <th className={cn(
        "text-left font-medium text-muted-foreground p-4 mobile-touch-target",
        className
      )}>
        {children}
      </th>
    );
  }
  
  return (
    <td className={cn("p-4 mobile-touch-target", className)}>
      {children}
    </td>
  );
};
