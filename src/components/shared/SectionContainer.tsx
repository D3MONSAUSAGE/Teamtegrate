
import React from 'react';
import { cn } from '@/lib/utils';

type BackgroundType = 'default' | 'muted' | 'primary' | 'card';
type MaxWidthType = '2xl' | '4xl' | '6xl' | '7xl' | 'full';

interface SectionContainerProps {
  children: React.ReactNode;
  background?: BackgroundType;
  maxWidth?: MaxWidthType;
  className?: string;
}

const backgroundStyles: Record<BackgroundType, string> = {
  default: 'bg-background',
  muted: 'bg-muted/30',
  primary: 'bg-primary',
  card: 'bg-card'
};

const maxWidthStyles: Record<MaxWidthType, string> = {
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  'full': 'max-w-full'
};

const SectionContainer: React.FC<SectionContainerProps> = ({ 
  children, 
  background = 'default', 
  maxWidth = '6xl',
  className = ''
}) => {
  return (
    <section className={cn(
      'py-12 md:py-20',
      backgroundStyles[background],
      'w-full overflow-x-hidden',
      className
    )}>
      <div className={cn(
        'container mx-auto px-4 sm:px-6 lg:px-8',
        maxWidthStyles[maxWidth],
        'w-full overflow-x-hidden'
      )}>
        {children}
      </div>
    </section>
  );
};

export default SectionContainer;
