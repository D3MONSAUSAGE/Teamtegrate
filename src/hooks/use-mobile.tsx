
import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth
      
      // Enhanced mobile detection using multiple criteria
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isNarrowScreen = width < MOBILE_BREAKPOINT
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches
      const hasNoHover = window.matchMedia('(hover: none)').matches
      
      // Consider mobile if:
      // - Screen is narrow (< 768px) OR
      // - Device has touch capability AND (has coarse pointer OR no hover capability)
      const mobile = isNarrowScreen || (isTouchDevice && (hasCoarsePointer || hasNoHover))
      
      setIsMobile(mobile)
    }
    
    // Check immediately on mount
    checkMobile()
    
    // Add event listener for window resize and orientation change
    window.addEventListener("resize", checkMobile)
    window.addEventListener("orientationchange", checkMobile)
    
    // Clean up event listeners
    return () => {
      window.removeEventListener("resize", checkMobile)
      window.removeEventListener("orientationchange", checkMobile)
    }
  }, [])

  return isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT)
    }
    
    // Check immediately on mount
    checkTablet()
    
    // Add event listener for window resize
    window.addEventListener("resize", checkTablet)
    
    // Clean up event listener
    return () => window.removeEventListener("resize", checkTablet)
  }, [])

  return !!isTablet
}

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= TABLET_BREAKPOINT)
    }
    
    // Check immediately on mount
    checkDesktop()
    
    // Add event listener for window resize
    window.addEventListener("resize", checkDesktop)
    
    // Clean up event listener
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  return !!isDesktop
}

export function useBreakpoint() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isDesktop = useIsDesktop()
  
  return {
    isMobile,
    isTablet,
    isDesktop
  }
}
