import { useEffect, useRef } from 'react';

interface UseScrollToBottomOptions {
  dependency: any[];
  threshold?: number;
  behavior?: ScrollBehavior;
}

export function useScrollToBottom({
  dependency,
  threshold = 100,
  behavior = 'smooth'
}: UseScrollToBottomOptions) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);

  // Check if user is near bottom
  const checkScrollPosition = () => {
    if (!scrollRef.current) return;
    
    const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!scrollArea) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollArea;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < threshold;
    shouldScrollRef.current = isNearBottom;
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    if (!scrollRef.current || !shouldScrollRef.current) return;

    const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!scrollArea) return;

    scrollArea.scrollTo({
      top: scrollArea.scrollHeight,
      behavior
    });
  };

  // Force scroll to bottom (always)
  const forceScrollToBottom = () => {
    if (!scrollRef.current) return;

    const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!scrollArea) return;

    scrollArea.scrollTo({
      top: scrollArea.scrollHeight,
      behavior
    });
  };

  // Auto-scroll when dependency changes
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 50); // Small delay for DOM updates
    return () => clearTimeout(timer);
  }, dependency);

  // Listen for scroll events to update shouldScroll
  useEffect(() => {
    if (!scrollRef.current) return;

    const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!scrollArea) return;

    scrollArea.addEventListener('scroll', checkScrollPosition);
    return () => scrollArea.removeEventListener('scroll', checkScrollPosition);
  }, [threshold]);

  return {
    scrollRef,
    scrollToBottom,
    forceScrollToBottom,
    shouldAutoScroll: shouldScrollRef.current
  };
}