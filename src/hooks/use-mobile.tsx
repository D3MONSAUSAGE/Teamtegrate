
import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

// Consolidated breakpoint state management
interface BreakpointState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

// Single resize listener for all breakpoint detection
const useBreakpointState = (): BreakpointState => {
  const [breakpointState, setBreakpointState] = React.useState<BreakpointState>(() => {
    // Initialize with current window size if available
    if (typeof window !== 'undefined') {
      const width = window.innerWidth
      return {
        isMobile: width < MOBILE_BREAKPOINT,
        isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
        isDesktop: width >= TABLET_BREAKPOINT
      }
    }
    
    // Default state for SSR
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true
    }
  })

  React.useEffect(() => {
    const checkBreakpoints = () => {
      const width = window.innerWidth
      const newState = {
        isMobile: width < MOBILE_BREAKPOINT,
        isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
        isDesktop: width >= TABLET_BREAKPOINT
      }
      
      // Only update if state has actually changed to prevent unnecessary re-renders
      setBreakpointState(prevState => {
        if (
          prevState.isMobile !== newState.isMobile ||
          prevState.isTablet !== newState.isTablet ||
          prevState.isDesktop !== newState.isDesktop
        ) {
          return newState
        }
        return prevState
      })
    }
    
    // Throttle resize events for better performance
    let timeoutId: NodeJS.Timeout
    const throttledCheck = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(checkBreakpoints, 100)
    }
    
    window.addEventListener("resize", throttledCheck)
    return () => {
      window.removeEventListener("resize", throttledCheck)
      clearTimeout(timeoutId)
    }
  }, [])

  return breakpointState
}

// Individual hooks that use the consolidated state
export function useIsMobile() {
  const { isMobile } = useBreakpointState()
  return isMobile
}

export function useIsTablet() {
  const { isTablet } = useBreakpointState()
  return isTablet
}

export function useIsDesktop() {
  const { isDesktop } = useBreakpointState()
  return isDesktop
}

export function useBreakpoint() {
  return useBreakpointState()
}
