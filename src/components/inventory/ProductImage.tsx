import React from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt = "Product image",
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-24 h-24'
  };

  if (!src) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-muted rounded-lg border border-border',
        sizeClasses[size],
        className
      )}>
        <Package className={cn(
          'text-muted-foreground',
          size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-8 w-8'
        )} />
      </div>
    );
  }

  return (
    <div className={cn(
      'overflow-hidden rounded-lg border border-border bg-muted',
      sizeClasses[size],
      className
    )}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Hide broken image and show placeholder
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent) {
            parent.innerHTML = `
              <div class="flex items-center justify-center w-full h-full">
                <svg class="text-muted-foreground ${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-8 w-8'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
              </div>
            `;
          }
        }}
      />
    </div>
  );
};