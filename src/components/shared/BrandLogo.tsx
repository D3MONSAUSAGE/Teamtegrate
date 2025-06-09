
import React from 'react';
import { BRAND_CONFIG } from '@/constants/brandConstants';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm', 
    lg: 'h-10 w-10 text-base'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${BRAND_CONFIG.logo.bgColor} rounded-lg flex items-center justify-center ${sizeClasses[size]}`}>
        <span className={`${BRAND_CONFIG.logo.textColor} font-bold`}>
          {BRAND_CONFIG.logo.text}
        </span>
      </div>
      {showText && (
        <span className={`font-bold text-primary ${textSizeClasses[size]}`}>
          {BRAND_CONFIG.name}
        </span>
      )}
    </div>
  );
};

export default BrandLogo;
