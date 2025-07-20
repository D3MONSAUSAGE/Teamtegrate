
import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const userAgent = navigator.userAgent
      
      // Simple mobile detection - only screen width
      const mobile = width < MOBILE_BREAKPOINT
      
      // Debug logging
      console.log('🔍 Mobile Detection Debug:', {
        width,
        height,
        mobile,
        userAgent: userAgent.substring(0, 50) + '...',
        breakpoint: MOBILE_BREAKPOINT
      })
      
      setIsMobile(mobile)
    }
    
    // Check immediately on mount
    checkMobile()
    
    // Add event listener for window resize
    window.addEventListener("resize", checkMobile)
    
    // Clean up event listener
    return () => window.removeEventListener("resize", checkMobile)
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
