import { useState, useEffect, useMemo, useCallback, useRef } from 'react'

interface UseVirtualizationOptions {
  itemCount: number
  itemHeight: number | ((index: number) => number)
  containerHeight: number
  overscan?: number
  scrollElement?: HTMLElement | null
}

interface VirtualizationResult {
  startIndex: number
  endIndex: number
  totalHeight: number
  items: Array<{
    index: number
    offsetTop: number
    height: number
  }>
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void
}

/**
 * Optimized virtualization hook for large lists
 */
export function useOptimizedVirtualization({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 5,
  scrollElement
}: UseVirtualizationOptions): VirtualizationResult {
  const [scrollTop, setScrollTop] = useState(0)
  const cacheRef = useRef<Map<number, number>>(new Map())
  
  // Memoized item heights and positions
  const { itemHeights, itemPositions, totalHeight } = useMemo(() => {
    const heights: number[] = []
    const positions: number[] = []
    let currentPosition = 0
    
    for (let i = 0; i < itemCount; i++) {
      const height = typeof itemHeight === 'function' ? itemHeight(i) : itemHeight
      heights[i] = height
      positions[i] = currentPosition
      currentPosition += height
    }
    
    return {
      itemHeights: heights,
      itemPositions: positions,
      totalHeight: currentPosition
    }
  }, [itemCount, itemHeight])

  // Calculate visible range
  const { startIndex, endIndex } = useMemo(() => {
    if (itemCount === 0) {
      return { startIndex: 0, endIndex: 0 }
    }

    // Binary search for start index
    let start = 0
    let end = itemCount - 1
    
    while (start <= end) {
      const mid = Math.floor((start + end) / 2)
      const itemTop = itemPositions[mid]
      const itemBottom = itemTop + itemHeights[mid]
      
      if (itemBottom <= scrollTop) {
        start = mid + 1
      } else if (itemTop >= scrollTop + containerHeight) {
        end = mid - 1
      } else {
        start = mid
        break
      }
    }

    // Find end index
    let visibleEnd = start
    while (
      visibleEnd < itemCount &&
      itemPositions[visibleEnd] < scrollTop + containerHeight
    ) {
      visibleEnd++
    }

    return {
      startIndex: Math.max(0, start - overscan),
      endIndex: Math.min(itemCount - 1, visibleEnd + overscan)
    }
  }, [scrollTop, containerHeight, itemCount, itemPositions, itemHeights, overscan])

  // Generate visible items
  const items = useMemo(() => {
    const result = []
    for (let i = startIndex; i <= endIndex; i++) {
      result.push({
        index: i,
        offsetTop: itemPositions[i],
        height: itemHeights[i]
      })
    }
    return result
  }, [startIndex, endIndex, itemPositions, itemHeights])

  // Scroll to index function
  const scrollToIndex = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!scrollElement || index < 0 || index >= itemCount) return

    const itemTop = itemPositions[index]
    const itemHeight = itemHeights[index]
    
    let scrollTo = itemTop

    switch (align) {
      case 'center':
        scrollTo = itemTop - (containerHeight - itemHeight) / 2
        break
      case 'end':
        scrollTo = itemTop - containerHeight + itemHeight
        break
      case 'start':
      default:
        scrollTo = itemTop
        break
    }

    scrollElement.scrollTo({
      top: Math.max(0, Math.min(scrollTo, totalHeight - containerHeight)),
      behavior: 'smooth'
    })
  }, [scrollElement, itemCount, itemPositions, itemHeights, containerHeight, totalHeight])

  // Handle scroll events
  useEffect(() => {
    if (!scrollElement) return

    const handleScroll = () => {
      setScrollTop(scrollElement.scrollTop)
    }

    scrollElement.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollElement.removeEventListener('scroll', handleScroll)
  }, [scrollElement])

  return {
    startIndex,
    endIndex,
    totalHeight,
    items,
    scrollToIndex
  }
}

/**
 * Hook for optimized rendering of large datasets
 */
export function useOptimizedRendering<T>(
  data: T[],
  dependencies: React.DependencyList = []
) {
  const [isStable, setIsStable] = useState(false)
  const stableDataRef = useRef<T[]>(data)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Mark as unstable immediately
    setIsStable(false)
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Set new timeout to mark as stable
    timeoutRef.current = setTimeout(() => {
      stableDataRef.current = data
      setIsStable(true)
    }, 100) // Debounce for 100ms
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, dependencies)

  return {
    data: isStable ? stableDataRef.current : data,
    isStable,
    isLoading: !isStable
  }
}