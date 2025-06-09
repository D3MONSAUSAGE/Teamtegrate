
import React from 'react';
import { cn } from '@/lib/utils';

interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
  background?: 'default' | 'muted' | 'primary';
  padding?: 'sm' | 'md' | 'lg';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl';
}

const SectionContainer: React.FC<SectionContainerProps> = ({
  children,
  className,
  background = 'default',
  padding = 'lg',
  maxWidth = '6xl'
}) => {
  const backgroundClasses = {
    default: 'bg-background',
    muted: 'bg-muted/50',
    primary: 'bg-primary'
  };

  const paddingClasses = {
    sm: 'py-12 px-4',
    md: 'py-16 px-4',
    lg: 'py-20 px-4'
  };

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl'
  };

  return (
    <section className={cn(backgroundClasses[background], paddingClasses[padding], className)}>
      <div className={cn('container mx-auto', maxWidthClasses[maxWidth])}>
        {children}
      </div>
    </section>
  );
};

export default SectionContainer;
