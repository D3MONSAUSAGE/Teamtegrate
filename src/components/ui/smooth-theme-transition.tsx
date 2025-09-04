import React, { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'

interface SmoothThemeTransitionProps {
  children: React.ReactNode
  duration?: number
}

/**
 * Component that provides smooth transitions when switching themes
 */
const SmoothThemeTransition: React.FC<SmoothThemeTransitionProps> = ({ 
  children, 
  duration = 300 
}) => {
  const { theme } = useTheme()
  const previousTheme = useRef<string | undefined>()
  const transitionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!transitionRef.current) return
    
    const element = transitionRef.current
    
    // Add transition styles when theme changes
    if (previousTheme.current !== undefined && previousTheme.current !== theme) {
      // Add transition classes
      element.style.transition = `
        background-color ${duration}ms ease-in-out,
        color ${duration}ms ease-in-out,
        border-color ${duration}ms ease-in-out
      `
      
      // Add transition to all child elements
      const allElements = element.querySelectorAll('*')
      allElements.forEach((child) => {
        const htmlChild = child as HTMLElement
        htmlChild.style.transition = `
          background-color ${duration}ms ease-in-out,
          color ${duration}ms ease-in-out,
          border-color ${duration}ms ease-in-out,
          fill ${duration}ms ease-in-out,
          stroke ${duration}ms ease-in-out
        `
      })
      
      // Remove transitions after animation completes
      setTimeout(() => {
        element.style.transition = ''
        allElements.forEach((child) => {
          const htmlChild = child as HTMLElement
          htmlChild.style.transition = ''
        })
      }, duration)
    }
    
    previousTheme.current = theme
  }, [theme, duration])

  return (
    <div ref={transitionRef} className="theme-transition-container">
      {children}
    </div>
  )
}

export default SmoothThemeTransition