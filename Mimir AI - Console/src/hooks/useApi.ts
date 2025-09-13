// Custom React hooks for API integration with proper error handling and loading states
import { useState, useEffect, useCallback, useRef } from 'react'
import type { 
  PaginatedResponse, 
  ApiResponse, 
  User, 
  APIToken, 
  KnowledgeDocument,
  SearchFilters 
} from '@/types'
import api, { apiUtils } from '@/services/api'

// Base hook state interface
interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  isSuccess: boolean
}

// Paginated hook state interface
interface UsePaginatedState<T> extends UseApiState<T[]> {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// Base API hook
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T> | PaginatedResponse<T>>,
  deps: any[] = [],
  immediate = true
): UseApiState<T> & {
  refetch: () => Promise<void>
  reset: () => void
} {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
    isSuccess: false
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  const execute = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await apiCall()
      
      if (!controller.signal.aborted) {
        setState({
          data: response.data as T || null,
          loading: false,
          error: null,
          isSuccess: true
        })
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        const errorMessage = apiUtils.handleApiError(error)
        setState({
          data: null,
          loading: false,
          error: errorMessage,
          isSuccess: false
        })
      }
    }
  }, deps)

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      isSuccess: false
    })
  }, [])

  useEffect(() => {
    if (immediate) {
      execute()
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [execute, immediate])

  return {
    ...state,
    refetch: execute,
    reset
  }
}

// Paginated API hook
export function usePaginatedApi<T>(
  apiCall: (filters?: SearchFilters) => Promise<PaginatedResponse<T>>,
  initialFilters: SearchFilters = {},
  immediate = true
): UsePaginatedState<T> & {
  setPage: (page: number) => void
  setFilters: (filters: SearchFilters) => void
  refetch: () => Promise<void>
  reset: () => void
} {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [state, setState] = useState<UsePaginatedState<T>>({
    data: [],
    loading: immediate,
    error: null,
    isSuccess: false,
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  const execute = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await apiCall(filters)
      
      if (!controller.signal.aborted) {
        setState({
          data: response.data || [],
          loading: false,
          error: null,
          isSuccess: true,
          currentPage: response.pagination.page,
          totalPages: response.pagination.totalPages,
          totalCount: response.pagination.total,
          hasNextPage: response.pagination.page < response.pagination.totalPages,
          hasPreviousPage: response.pagination.page > 1
        })
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        const errorMessage = apiUtils.handleApiError(error)
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
          isSuccess: false
        }))
      }
    }
  }, [apiCall, filters])

  const setPage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }, [])

  const updateFilters = useCallback((newFilters: SearchFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }, [])

  const reset = useCallback(() => {
    setState({
      data: [],
      loading: false,
      error: null,
      isSuccess: false,
      currentPage: 1,
      totalPages: 0,
      totalCount: 0,
      hasNextPage: false,
      hasPreviousPage: false
    })
    setFilters(initialFilters)
  }, [initialFilters])

  useEffect(() => {
    if (immediate) {
      execute()
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [execute, immediate])

  return {
    ...state,
    setPage,
    setFilters: updateFilters,
    refetch: execute,
    reset
  }
}

// Mutation hook for create/update/delete operations
export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void
    onError?: (error: string, variables: TVariables) => void
    onSettled?: (data: TData | null, error: string | null, variables: TVariables) => void
  }
): {
  mutate: (variables: TVariables) => Promise<void>
  data: TData | null
  loading: boolean
  error: string | null
  isSuccess: boolean
  reset: () => void
} {
  const [state, setState] = useState<{
    data: TData | null
    loading: boolean
    error: string | null
    isSuccess: boolean
  }>({
    data: null,
    loading: false,
    error: null,
    isSuccess: false
  })

  const mutate = useCallback(async (variables: TVariables) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await mutationFn(variables)
      const data = response.data

      if (data) {
        setState({
          data,
          loading: false,
          error: null,
          isSuccess: true
        })

        options?.onSuccess?.(data, variables)
        options?.onSettled?.(data, null, variables)
      }
    } catch (error) {
      const errorMessage = apiUtils.handleApiError(error)
      
      setState({
        data: null,
        loading: false,
        error: errorMessage,
        isSuccess: false
      })

      options?.onError?.(errorMessage, variables)
      options?.onSettled?.(null, errorMessage, variables)
    }
  }, [mutationFn, options])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      isSuccess: false
    })
  }, [])

  return {
    mutate,
    ...state,
    reset
  }
}

// Specific hooks for common operations

// Users hooks
export function useUsers(filters?: SearchFilters) {
  return usePaginatedApi(api.users.getUsers, filters)
}

export function useUser(id: string) {
  return useApi(() => api.users.getUser(id), [id], !!id)
}

export function useUpdateUser() {
  return useMutation(({ id, data }: { id: string; data: Partial<User> }) =>
    api.users.updateUser(id, data)
  )
}

export function useDeleteUser() {
  return useMutation((id: string) => api.users.deleteUser(id))
}

// API Tokens hooks
export function useTokens(filters?: SearchFilters) {
  return usePaginatedApi(api.tokens.getTokens, filters)
}

export function useCreateToken() {
  return useMutation((data: any) => api.tokens.createToken(data))
}

export function useUpdateToken() {
  return useMutation(({ id, data }: { id: string; data: Partial<APIToken> }) =>
    api.tokens.updateToken(id, data)
  )
}

export function useDeleteToken() {
  return useMutation((id: string) => api.tokens.deleteToken(id))
}

export function useRotateToken() {
  return useMutation((id: string) => api.tokens.rotateToken(id))
}

// Knowledge Base hooks
export function useSectors(includeAnalytics = false) {
  return useApi(() => api.knowledgeBase.getSectors(includeAnalytics), [includeAnalytics])
}

export function useDocuments(filters?: SearchFilters) {
  return usePaginatedApi(api.knowledgeBase.getDocuments, filters)
}

export function useUploadDocument() {
  return useMutation(({ file, metadata }: { file: File; metadata: any }) =>
    api.knowledgeBase.uploadDocument(file, metadata)
  )
}

export function useBulkUploadDocuments() {
  return useMutation(({ files, metadata }: { files: File[]; metadata: any }) =>
    api.knowledgeBase.bulkUploadDocuments(files, metadata)
  )
}

export function useUpdateDocument() {
  return useMutation(({ id, data }: { id: string; data: Partial<KnowledgeDocument> }) =>
    api.knowledgeBase.updateDocument(id, data)
  )
}

export function useDeleteDocument() {
  return useMutation((id: string) => api.knowledgeBase.deleteDocument(id))
}

// Analytics hooks
export function useDashboard(dateRange?: string, department?: string) {
  return useApi(() => api.analytics.getDashboard(dateRange, department), [dateRange, department])
}

export function useDepartmentAnalytics(filters?: any) {
  return useApi(() => api.analytics.getDepartmentAnalytics(filters), [filters])
}

export function useUserAnalytics(filters?: SearchFilters) {
  return usePaginatedApi(api.analytics.getUserAnalytics, filters)
}

// Reports hooks
export function useReports(filters?: SearchFilters) {
  return usePaginatedApi(api.reports.getReports, filters)
}

export function useGenerateReport() {
  return useMutation((request: any) => api.reports.generateReport(request))
}

// System hooks
export function useSystemSettings() {
  return useApi(api.system.getSettings)
}

export function useUpdateSystemSettings() {
  return useMutation((settings: any) => api.system.updateSettings(settings))
}

export function useSystemHealth() {
  return useApi(api.system.getHealth)
}

export function useAuditLogs(filters?: SearchFilters) {
  return usePaginatedApi(api.system.getAuditLogs, filters)
}

// File download hook
export function useFileDownload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const download = useCallback(async (
    downloadFn: () => Promise<Blob>,
    filename: string
  ) => {
    setLoading(true)
    setError(null)

    try {
      const blob = await downloadFn()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      setError(apiUtils.handleApiError(error))
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    download,
    loading,
    error
  }
}

// Polling hook for real-time updates
export function usePolling<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  interval: number = 5000,
  enabled: boolean = true
): UseApiState<T> & {
  start: () => void
  stop: () => void
  refetch: () => Promise<void>
} {
  const [isPolling, setIsPolling] = useState(enabled)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const { data, loading, error, isSuccess, refetch } = useApi(
    apiCall,
    [],
    enabled
  )

  const start = useCallback(() => {
    setIsPolling(true)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    intervalRef.current = setInterval(refetch, interval)
  }, [refetch, interval])

  const stop = useCallback(() => {
    setIsPolling(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (isPolling && enabled) {
      start()
    } else {
      stop()
    }

    return stop
  }, [isPolling, enabled, start, stop])

  return {
    data,
    loading,
    error,
    isSuccess,
    start,
    stop,
    refetch
  }
}

// Export all hooks
export default {
  useApi,
  usePaginatedApi,
  useMutation,
  useUsers,
  useUser,
  useUpdateUser,
  useDeleteUser,
  useTokens,
  useCreateToken,
  useUpdateToken,
  useDeleteToken,
  useRotateToken,
  useSectors,
  useDocuments,
  useUploadDocument,
  useBulkUploadDocuments,
  useUpdateDocument,
  useDeleteDocument,
  useDashboard,
  useDepartmentAnalytics,
  useUserAnalytics,
  useReports,
  useGenerateReport,
  useSystemSettings,
  useUpdateSystemSettings,
  useSystemHealth,
  useAuditLogs,
  useFileDownload,
  usePolling
}
