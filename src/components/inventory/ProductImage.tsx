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
    md: 'w-16 h-16', 
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-16 w-16'
  };

  if (!src || imageError) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-gradient-to-br from-muted/80 to-muted rounded-lg border border-border',
        sizeClasses[size],
        className
      )}>
        <Package className={cn(
          'text-muted-foreground/50',
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