import React, { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { LoadingState } from '@/types'

interface LoadingContextType {
  loadingStates: LoadingState
  setLoading: (key: string, isLoading: boolean) => void
  isLoading: (key: string) => boolean
  isAnyLoading: () => boolean
  clearAll: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

interface LoadingProviderProps {
  children: ReactNode
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({})

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }))
  }, [])

  const isLoading = useCallback((key: string) => {
    return !!loadingStates[key]
  }, [loadingStates])

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(loading => loading)
  }, [loadingStates])

  const clearAll = useCallback(() => {
    setLoadingStates({})
  }, [])

  return (
    <LoadingContext.Provider value={{
      loadingStates,
      setLoading,
      isLoading,
      isAnyLoading,
      clearAll
    }}>
      {children}
    </LoadingContext.Provider>
  )
}

export const useLoading = () => {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

interface AsyncOperationOptions<T> {
  onSuccess?: (result: T) => void
  onError?: (error: Error) => void
  showErrorToast?: boolean
}

/**
 * Hook for managing loading state of async operations
 */
export const useAsyncOperation = (key: string) => {
  const { setLoading, isLoading } = useLoading()

  const executeAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    options?: AsyncOperationOptions<T>
  ): Promise<T | undefined> => {
    try {
      setLoading(key, true)
      const result = await operation()
      options?.onSuccess?.(result)
      return result
    } catch (error) {
      console.error(`Operation ${key} failed:`, error)
      options?.onError?.(error as Error)
      
      if (options?.showErrorToast !== false) {
        // You can integrate with toast context here
        console.error(`Error in ${key}:`, error)
      }
      
      throw error
    } finally {
      setLoading(key, false)
    }
  }, [key, setLoading])

  return {
    isLoading: isLoading(key),
    executeAsync
  }
}

/**
 * HOC that provides loading state management
 */
export function withLoadingState<P extends object>(
  Component: React.ComponentType<P>,
  loadingKey?: string
) {
  const WrappedComponent = (props: P) => {
    const key = loadingKey || Component.displayName || Component.name || 'component'
    const { isLoading, executeAsync } = useAsyncOperation(key)

    return (
      <Component 
        {...props} 
        isLoading={isLoading}
        executeAsync={executeAsync}
      />
    )
  }

  WrappedComponent.displayName = `withLoadingState(${Component.displayName || Component.name})`
  return WrappedComponent
}
