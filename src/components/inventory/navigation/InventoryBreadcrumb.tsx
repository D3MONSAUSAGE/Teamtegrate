import React from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Home, Package } from 'lucide-react';

interface InventoryBreadcrumbProps {
  currentPage: string;
  parentPage?: {
    name: string;
    href: string;
  };
}

export const InventoryBreadcrumb: React.FC<InventoryBreadcrumbProps> = ({
  currentPage,
  parentPage
}) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        <BreadcrumbSeparator />
        
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard/inventory" className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              Inventory
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {parentPage && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={parentPage.href}>
                  {parentPage.name}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        
        <BreadcrumbSeparator />
        
        <BreadcrumbItem>
          <BreadcrumbPage>{currentPage}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};