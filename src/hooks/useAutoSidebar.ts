import { useState, useEffect, useRef, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

// This hook is deprecated in favor of the shadcn sidebar system
// Keeping for backward compatibility but recommend using useSidebar from @/components/ui/sidebar
export const useAutoSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();
  const isMobile = useIsMobile();
  
  const expandSidebar = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsExpanded(true);
  }, []);

  const collapseSidebar = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 300); // 300ms delay before collapsing
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!isMobile) {
      expandSidebar();
    }
  }, [isMobile, expandSidebar]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile) {
      collapseSidebar();
    }
  }, [isMobile, collapseSidebar]);

  const handleMobileToggle = useCallback(() => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    }
  }, [isMobile, isMobileOpen]);

  const handleBackdropClick = useCallback(() => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  }, [isMobile]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return {
    isExpanded: isMobile ? isMobileOpen : isExpanded,
    isMobileOpen,
    handleMouseEnter,
    handleMouseLeave,
    handleMobileToggle,
    handleBackdropClick,
    isMobile
  };
};
