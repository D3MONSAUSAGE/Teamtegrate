import { useEffect, useCallback, useRef } from 'react'

interface UseKeyboardNavigationOptions {
  enabled?: boolean
  onEscape?: () => void
  onEnter?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onHome?: () => void
  onEnd?: () => void
  onTab?: (direction: 'forward' | 'backward') => void
  preventDefault?: string[]
}

/**
 * Hook for handling keyboard navigation
 */
export function useKeyboardNavigation(options: UseKeyboardNavigationOptions = {}) {
  const {
    enabled = true,
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onHome,
    onEnd,
    onTab,
    preventDefault = []
  } = options

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    const { key, shiftKey } = event

    // Check if we should prevent default for this key
    if (preventDefault.includes(key)) {
      event.preventDefault()
    }

    switch (key) {
      case 'Escape':
        onEscape?.()
        break

      case 'Enter':
        onEnter?.()
        break

      case 'ArrowUp':
        event.preventDefault()
        onArrowUp?.()
        break

      case 'ArrowDown':
        event.preventDefault()
        onArrowDown?.()
        break

      case 'ArrowLeft':
        event.preventDefault()
        onArrowLeft?.()
        break

      case 'ArrowRight':
        event.preventDefault()
        onArrowRight?.()
        break

      case 'Home':
        event.preventDefault()
        onHome?.()
        break

      case 'End':
        event.preventDefault()
        onEnd?.()
        break

      case 'Tab':
        if (onTab) {
          const direction = shiftKey ? 'backward' : 'forward'
          onTab(direction)
        }
        break
    }
  }, [
    enabled,
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onHome,
    onEnd,
    onTab,
    preventDefault
  ])

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, handleKeyDown])

  return { handleKeyDown }
}

/**
 * Hook for managing focus within a list or collection
 */
export function useListNavigation<T extends HTMLElement = HTMLElement>(
  items: T[],
  options: {
    enabled?: boolean
    loop?: boolean
    orientation?: 'horizontal' | 'vertical' | 'both'
    onSelect?: (index: number, item: T) => void
  } = {}
) {
  const {
    enabled = true,
    loop = false,
    orientation = 'vertical',
    onSelect
  } = options

  const currentIndexRef = useRef(0)

  const focusItem = useCallback((index: number) => {
    if (items[index]) {
      items[index].focus()
      currentIndexRef.current = index
    }
  }, [items])

  const moveToNext = useCallback(() => {
    const nextIndex = currentIndexRef.current + 1
    if (nextIndex < items.length) {
      focusItem(nextIndex)
    } else if (loop) {
      focusItem(0)
    }
  }, [items.length, loop, focusItem])

  const moveToPrevious = useCallback(() => {
    const previousIndex = currentIndexRef.current - 1
    if (previousIndex >= 0) {
      focusItem(previousIndex)
    } else if (loop) {
      focusItem(items.length - 1)
    }
  }, [items.length, loop, focusItem])

  const moveToFirst = useCallback(() => {
    focusItem(0)
  }, [focusItem])

  const moveToLast = useCallback(() => {
    focusItem(items.length - 1)
  }, [items.length, focusItem])

  const selectCurrent = useCallback(() => {
    const currentItem = items[currentIndexRef.current]
    if (currentItem && onSelect) {
      onSelect(currentIndexRef.current, currentItem)
    }
  }, [items, onSelect])

  const keyboardProps = useKeyboardNavigation({
    enabled,
    onArrowDown: orientation === 'vertical' || orientation === 'both' ? moveToNext : undefined,
    onArrowUp: orientation === 'vertical' || orientation === 'both' ? moveToPrevious : undefined,
    onArrowRight: orientation === 'horizontal' || orientation === 'both' ? moveToNext : undefined,
    onArrowLeft: orientation === 'horizontal' || orientation === 'both' ? moveToPrevious : undefined,
    onHome: moveToFirst,
    onEnd: moveToLast,
    onEnter: selectCurrent,
    preventDefault: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
  })

  return {
    ...keyboardProps,
    focusItem,
    moveToNext,
    moveToPrevious,
    moveToFirst,
    moveToLast,
    selectCurrent,
    currentIndex: currentIndexRef.current
  }
}