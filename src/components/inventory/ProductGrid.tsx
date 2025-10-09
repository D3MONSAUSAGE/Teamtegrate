import React from 'react';
import { ProductCard, ProductCardItem } from './ProductCard';
import { Skeleton } from '@/components/ui/enhanced-skeleton';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductGridProps {
  items: ProductCardItem[];
  variant?: 'warehouse' | 'master';
  loading?: boolean;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  emptyState?: {
    title: string;
    description: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  items,
  variant = 'warehouse',
  loading = false,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  emptyState
}) => {
  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-[400px]">
            <Skeleton className="h-full w-full rounded-xl" variant="shimmer" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="rounded-full bg-muted p-6 mb-6">
          <Package className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">
          {emptyState?.title || 'No products found'}
        </h3>
        <p className="text-muted-foreground max-w-md mb-6">
          {emptyState?.description || 'Try adjusting your search or filters to find what you\'re looking for.'}
        </p>
        {emptyState?.action && (
          <Button onClick={emptyState.action.onClick}>
            {emptyState.action.label}
          </Button>
        )}
      </div>
    );
  }

  // Grid view
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <ProductCard
          key={item.id}
          item={item}
          variant={variant}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={showActions}
        />
      ))}
    </div>
  );
};