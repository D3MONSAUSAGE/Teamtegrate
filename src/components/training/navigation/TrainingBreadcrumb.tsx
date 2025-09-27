import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface TrainingBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function TrainingBreadcrumb({ items }: TrainingBreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <React.Fragment key={item.href}>
          {index === items.length - 1 ? (
            <span className="text-foreground font-medium">{item.label}</span>
          ) : (
            <>
              <Link 
                to={item.href} 
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}