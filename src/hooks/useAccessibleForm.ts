import { useCallback, useRef, useEffect } from 'react'

interface UseAccessibleFormOptions {
  announceErrors?: boolean
  focusFirstError?: boolean
  validateOnBlur?: boolean
}

/**
 * Hook for making forms more accessible
 */
export function useAccessibleForm(options: UseAccessibleFormOptions = {}) {
  const {
    announceErrors = true,
    focusFirstError = true,
    validateOnBlur = true
  } = options

  const announcementRef = useRef<HTMLDivElement | null>(null)
  const errorFieldsRef = useRef<Set<string>>(new Set())

  // Create or get the announcement area for screen readers
  useEffect(() => {
    if (!announceErrors) return

    let announcer = document.getElementById('form-announcer') as HTMLDivElement
    if (!announcer) {
      announcer = document.createElement('div')
      announcer.id = 'form-announcer'
      announcer.setAttribute('aria-live', 'polite')
      announcer.setAttribute('aria-atomic', 'true')
      announcer.className = 'sr-only'
      document.body.appendChild(announcer)
    }
    announcementRef.current = announcer

    return () => {
      if (document.body.contains(announcer)) {
        document.body.removeChild(announcer)
      }
    }
  }, [announceErrors])

  const announceToScreenReader = useCallback((message: string) => {
    if (!announceErrors || !announcementRef.current) return

    announcementRef.current.textContent = message
    
    // Clear the message after a short delay to allow for re-announcement
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = ''
      }
    }, 1000)
  }, [announceErrors])

  const announceError = useCallback((fieldName: string, errorMessage: string) => {
    const message = `Error in ${fieldName}: ${errorMessage}`
    announceToScreenReader(message)
  }, [announceToScreenReader])

  const announceSuccess = useCallback((message: string = 'Form submitted successfully') => {
    announceToScreenReader(message)
  }, [announceToScreenReader])

  const addFieldError = useCallback((fieldName: string, errorMessage: string) => {
    errorFieldsRef.current.add(fieldName)
    if (announceErrors) {
      announceError(fieldName, errorMessage)
    }
  }, [announceErrors, announceError])

  const removeFieldError = useCallback((fieldName: string) => {
    errorFieldsRef.current.delete(fieldName)
  }, [])

  const clearAllErrors = useCallback(() => {
    errorFieldsRef.current.clear()
  }, [])

  const focusFirstErrorField = useCallback(() => {
    if (!focusFirstError || errorFieldsRef.current.size === 0) return

    const firstErrorField = Array.from(errorFieldsRef.current)[0]
    const element = document.querySelector(`[name="${firstErrorField}"], #${firstErrorField}`) as HTMLElement
    
    if (element) {
      element.focus()
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [focusFirstError])

  const getFieldProps = useCallback((fieldName: string) => {
    const hasError = errorFieldsRef.current.has(fieldName)
    
    return {
      'aria-invalid': hasError,
      'aria-describedby': hasError ? `${fieldName}-error` : undefined,
    }
  }, [])

  const getErrorProps = useCallback((fieldName: string) => {
    return {
      id: `${fieldName}-error`,
      role: 'alert',
      'aria-live': 'polite' as const,
    }
  }, [])

  const handleSubmit = useCallback((onSubmit: (data: any) => void | Promise<void>) => {
    return async (data: any) => {
      try {
        await onSubmit(data)
        clearAllErrors()
        announceSuccess()
      } catch (error: any) {
        // Focus first error field if submission fails
        setTimeout(focusFirstErrorField, 100)
        throw error
      }
    }
  }, [clearAllErrors, announceSuccess, focusFirstErrorField])

  return {
    announceError,
    announceSuccess,
    announceToScreenReader,
    addFieldError,
    removeFieldError,
    clearAllErrors,
    focusFirstErrorField,
    getFieldProps,
    getErrorProps,
    handleSubmit,
    hasErrors: errorFieldsRef.current.size > 0,
    errorCount: errorFieldsRef.current.size
  }
}