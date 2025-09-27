import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface FinanceBreadcrumbProps {
  items: BreadcrumbItem[];
}

export const FinanceBreadcrumb: React.FC<FinanceBreadcrumbProps> = ({ items }) => {
  const location = useLocation();

  // Always start with Dashboard
  const allItems = [
    { label: 'Dashboard', href: '/dashboard' },
    ...items
  ];

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Home className="h-4 w-4" />
      {allItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {item.href && location.pathname !== item.href ? (
            <Link 
              to={item.href} 
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={location.pathname === item.href ? 'text-foreground font-medium' : ''}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};