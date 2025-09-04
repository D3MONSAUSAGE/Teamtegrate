import React from 'react'
import { cn } from '@/lib/utils'

interface ScreenReaderOnlyProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  as?: keyof JSX.IntrinsicElements
}

/**
 * Screen reader only component - visually hidden but accessible to screen readers
 */
const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({ 
  children, 
  className, 
  as: Component = 'span',
  ...props 
}) => {
  return React.createElement(
    Component,
    {
      className: cn(
        "sr-only absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0",
        className
      ),
      ...props
    },
    children
  )
}

export default ScreenReaderOnly