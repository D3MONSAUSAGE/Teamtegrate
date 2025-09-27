import React, { useState } from 'react';
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
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-8 w-8'
  };

  if (!src || imageError) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-muted rounded-lg border border-border',
        sizeClasses[size],
        className
      )}>
        <Package className={cn(
          'text-muted-foreground',
          iconSizes[size]
        )} />
      </div>
    );
  }

  return (
    <div className={cn(
      'overflow-hidden rounded-lg border border-border bg-muted relative',
      sizeClasses[size],
      className
    )}>
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Package className={cn(
            'text-muted-foreground animate-pulse',
            iconSizes[size]
          )} />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity",
          imageLoading ? "opacity-0" : "opacity-100"
        )}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
      />
    </div>
  );
};