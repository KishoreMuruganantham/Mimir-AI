// API service layer with proper error handling and TypeScript interfaces
import type { 
  ApiResponse, 
  PaginatedResponse, 
  User, 
  APIToken, 
  CreateTokenRequest,
  KnowledgeDocument,
  Sector,
  DepartmentMetrics,
  UserAnalytics,
  GeneratedReport,
  ReportRequest,
  SystemSettings,
  AuditLog,
  SearchFilters
} from '@/types'
import { API_CONFIG, buildUrl } from '@/config/api'

// Custom error class for API errors
export class ApiError extends Error {
  status: number
  code: string
  details?: any

  constructor(
    message: string,
    status: number,
    code: string,
    details?: any
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

// Request configuration interface
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number
  retries?: number
}

// Base API client class
class ApiClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  private async makeRequest<T>(
    endpoint: string, 
    config: RequestConfig = {}
  ): Promise<T> {
    const { 
      method = 'GET', 
      headers = {}, 
      body, 
      timeout = API_CONFIG.TIMEOUT,
      retries = 3 
    } = config

    const url = `${this.baseUrl}${endpoint}`
    const authToken = this.getAuthToken()

    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers
    }

    if (authToken) {
      requestHeaders['Authorization'] = `Bearer ${authToken}`
    }

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(timeout)
    }

    if (body && method !== 'GET') {
      if (body instanceof FormData) {
        // Remove Content-Type header for FormData to let browser set it with boundary
        delete requestHeaders['Content-Type']
        requestConfig.body = body
      } else {
        requestConfig.body = JSON.stringify(body)
      }
    }

    let lastError: Error

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, requestConfig)
        
        // Handle different response types
        const contentType = response.headers.get('content-type')
        let responseData: any

        if (contentType?.includes('application/json')) {
          responseData = await response.json()
        } else {
          responseData = await response.text()
        }

        // Handle HTTP errors
        if (!response.ok) {
          const errorMessage = responseData?.message || responseData?.error || `HTTP ${response.status}`
          const errorCode = responseData?.error || 'HTTP_ERROR'
          
          throw new ApiError(
            errorMessage,
            response.status,
            errorCode,
            responseData
          )
        }

        return responseData
      } catch (error) {
        lastError = error as Error

        // Don't retry on authentication errors or client errors (4xx)
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          throw error
        }

        // Don't retry on the last attempt
        if (attempt === retries) {
          break
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }

  // Public API methods
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`
      }
    }

    return this.makeRequest<T>(url, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'POST', body: data })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'PUT', body: data })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' })
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.makeRequest<T>(endpoint, { 
      method: 'POST', 
      body: formData,
      timeout: 60000 // Longer timeout for uploads
    })
  }

  // API Token creation with x-www-form-urlencoded
  async createApiToken(
    username: string, 
    password: string, 
    options?: { name?: string; department?: string }
  ): Promise<{ access_token: string; token_type: string }> {
    const formBody = new URLSearchParams();
    formBody.append('username', username);
    formBody.append('password', password);
    
    // Add optional fields if provided
    if (options?.name) {
      formBody.append('name', options.name);
    }
    if (options?.department) {
      formBody.append('department', options.department);
    }
    
    const response = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formBody.toString(),
    });
    if (!response.ok) {
      throw new ApiError('Failed to create API token', response.status, 'TOKEN_ERROR');
    }
    return response.json();
  }
}

// Create API client instance
const apiClient = new ApiClient(API_CONFIG.BASE_URL)

// Authentication API
export const authApi = {
  async login(email: string, password: string): Promise<{ status: boolean; message: string }> {
    // Use the updated endpoint and response shape
    return apiClient.post('/login', { email, password })
  },

  async signup(email: string, password: string, username: string): Promise<{ status: boolean; message?: string; error?: string }> {
    return apiClient.post('/signup', { email, password, username })
  },

  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post('/auth/logout')
  },

  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get('/auth/profile')
  },

  async refreshToken(): Promise<ApiResponse<{ token: string; expiresAt: string }>> {
    return apiClient.post('/auth/refresh')
  },

  async otpGenerator(email: string): Promise<{ status: boolean; message?: string; error?: string }> {
    return apiClient.post('/otp_generator', { email })
  },

  async otpAuth(email: string, otp: string): Promise<{ status: boolean; error?: string }> {
    return apiClient.post('/otp_auth', { email, otp })
  }
}

// Users API
export const usersApi = {
  async getUsers(filters?: SearchFilters): Promise<PaginatedResponse<User>> {
    return apiClient.get('/users', filters)
  },

  async getUser(id: string): Promise<ApiResponse<User>> {
    return apiClient.get(`/users/${id}`)
  },

  async updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.put(`/users/${id}`, data)
  },

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/users/${id}`)
  }
}

// API Tokens API
export const tokensApi = {
  async getTokens(filters?: SearchFilters): Promise<PaginatedResponse<APIToken>> {
    return apiClient.get('/tokens', filters)
  },

  async getToken(id: string): Promise<ApiResponse<APIToken>> {
    return apiClient.get(`/tokens/${id}`)
  },

  async createToken(data: CreateTokenRequest): Promise<ApiResponse<{ token: APIToken; plainTextToken: string }>> {
    return apiClient.post('/tokens', data)
  },

  async updateToken(id: string, data: Partial<APIToken>): Promise<ApiResponse<APIToken>> {
    return apiClient.put(`/tokens/${id}`, data)
  },

  async deleteToken(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/tokens/${id}`)
  },

  async rotateToken(id: string): Promise<ApiResponse<{ token: APIToken; plainTextToken: string }>> {
    return apiClient.post(`/tokens/${id}/rotate`)
  },

  async createApiToken(
    username: string, 
    password: string, 
    options?: { name?: string; department?: string }
  ): Promise<{ access_token: string; token_type: string }> {
    return apiClient.createApiToken(username, password, options);
  }
}

// Knowledge Base API
export const knowledgeBaseApi = {
  async getSectors(includeAnalytics = false): Promise<ApiResponse<Sector[]>> {
    return apiClient.get('/knowledge-base/sectors', { includeAnalytics })
  },

  async createSector(data: Partial<Sector>): Promise<ApiResponse<Sector>> {
    return apiClient.post('/knowledge-base/sectors', data)
  },

  async updateSector(id: string, data: Partial<Sector>): Promise<ApiResponse<Sector>> {
    return apiClient.put(`/knowledge-base/sectors/${id}`, data)
  },

  async getDocuments(filters?: SearchFilters): Promise<PaginatedResponse<KnowledgeDocument>> {
    return apiClient.get('/knowledge-base/documents', filters)
  },

  async getDocument(id: string): Promise<ApiResponse<KnowledgeDocument>> {
    return apiClient.get(`/knowledge-base/documents/${id}`)
  },

  async uploadDocument(file: File, metadata: {
    sector: string
    department?: string
    description?: string
    tags?: string[]
    accessLevel?: string
  }): Promise<ApiResponse<KnowledgeDocument>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('sector', metadata.sector)
    
    if (metadata.department) formData.append('department', metadata.department)
    if (metadata.description) formData.append('description', metadata.description)
    if (metadata.tags) formData.append('tags', metadata.tags.join(','))
    if (metadata.accessLevel) formData.append('accessLevel', metadata.accessLevel)

    return apiClient.upload('/knowledge-base/documents', formData)
  },

  async bulkUploadDocuments(files: File[], metadata: {
    sector: string
    department?: string
    accessLevel?: string
    autoTagging?: boolean
  }): Promise<ApiResponse<{
    uploaded: KnowledgeDocument[]
    failed: Array<{ filename: string; error: string }>
  }>> {
    const formData = new FormData()
    
    files.forEach(file => {
      formData.append('files', file)
    })
    
    formData.append('sector', metadata.sector)
    if (metadata.department) formData.append('department', metadata.department)
    if (metadata.accessLevel) formData.append('accessLevel', metadata.accessLevel)
    if (metadata.autoTagging) formData.append('autoTagging', 'true')

    return apiClient.upload('/knowledge-base/documents/bulk', formData)
  },

  async updateDocument(id: string, data: Partial<KnowledgeDocument>): Promise<ApiResponse<KnowledgeDocument>> {
    return apiClient.put(`/knowledge-base/documents/${id}`, data)
  },

  async deleteDocument(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/knowledge-base/documents/${id}`)
  },

  async downloadDocument(id: string): Promise<Blob> {
    // Special handling for file downloads
    const authToken = localStorage.getItem('auth_token')
    const response = await fetch(`${API_CONFIG.BASE_URL}${buildUrl(API_CONFIG.ENDPOINTS.KNOWLEDGE_BASE.DOCUMENT_DOWNLOAD, { id })}`, {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    })

    if (!response.ok) {
      throw new ApiError('Download failed', response.status, 'DOWNLOAD_ERROR')
    }

    return response.blob()
  },

  async processDocuments(fileUrls: string[], rewrite: boolean = true, apiKey?: string): Promise<ApiResponse<{
    message: string
    processedCount: number
    status: string
  }>> {
    const processingUrl = 'https://enhanced-stinkbug-willingly.ngrok-free.app/process'
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }

      // Add Authorization header if API key is provided
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`
      }

      const response = await fetch(processingUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          files: fileUrls,
          rewrite: rewrite
        })
      })

      if (!response.ok) {
        throw new ApiError(
          `Processing failed: ${response.statusText}`,
          response.status,
          'PROCESSING_ERROR'
        )
      }

      const data = await response.json()
      return {
        success: true,
        data: {
          message: data.message || 'Documents processed successfully',
          processedCount: fileUrls.length,
          status: data.status || 'completed'
        },
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(
        `Failed to process documents: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'PROCESSING_ERROR'
      )
    }
  }
}

// Analytics API
export const analyticsApi = {
  async getDashboard(dateRange?: string, department?: string): Promise<ApiResponse<{
    totalUsers: number
    activeTokens: number
    totalQueries: number
    avgResponseTime: number
    satisfactionScore: number
    trends: any[]
    topDepartments: DepartmentMetrics[]
    recentActivity: any[]
  }>> {
    return apiClient.get('/analytics/dashboard', { dateRange, department })
  },

  async getDepartmentAnalytics(filters?: {
    department?: string
    dateRange?: string
    metrics?: string[]
  }): Promise<ApiResponse<DepartmentMetrics[]>> {
    return apiClient.get('/analytics/departments', filters)
  },

  async getUserAnalytics(filters?: SearchFilters): Promise<PaginatedResponse<UserAnalytics>> {
    return apiClient.get('/analytics/users', filters)
  },

  async getTokenAnalytics(filters?: {
    tokenId?: string
    department?: string
    dateRange?: string
  }): Promise<ApiResponse<any[]>> {
    return apiClient.get('/analytics/tokens', filters)
  }
}

// Reports API
export const reportsApi = {
  async generateReport(request: ReportRequest): Promise<ApiResponse<{
    reportId: string
    status: string
    estimatedCompletion: string
  }>> {
    return apiClient.post('/reports/generate', request)
  },

  async getReport(id: string): Promise<ApiResponse<GeneratedReport>> {
    return apiClient.get(`/reports/${id}`)
  },

  async getReports(filters?: SearchFilters): Promise<PaginatedResponse<GeneratedReport>> {
    return apiClient.get('/reports', filters)
  },

  async downloadReport(id: string): Promise<Blob> {
    const authToken = localStorage.getItem('auth_token')
    const response = await fetch(`${API_CONFIG.BASE_URL}${buildUrl(API_CONFIG.ENDPOINTS.REPORTS.DOWNLOAD, { id })}`, {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    })

    if (!response.ok) {
      throw new ApiError('Report download failed', response.status, 'DOWNLOAD_ERROR')
    }

    return response.blob()
  }
}

// System API
export const systemApi = {
  async getSettings(): Promise<ApiResponse<SystemSettings>> {
    return apiClient.get('/system/settings')
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<ApiResponse<SystemSettings>> {
    return apiClient.put('/system/settings', settings)
  },

  async getHealth(): Promise<ApiResponse<{
    status: string
    services: Record<string, string>
    metrics: Record<string, number>
    lastChecked: string
  }>> {
    return apiClient.get('/system/health')
  },

  async getAuditLogs(filters?: SearchFilters): Promise<PaginatedResponse<AuditLog>> {
    return apiClient.get('/system/audit-logs', filters)
  }
}

// API utility functions
export const apiUtils = {
  // Error handling helper
  handleApiError(error: unknown): string {
    if (error instanceof ApiError) {
      return error.message
    }
    
    if (error instanceof Error) {
      return error.message
    }
    
    return 'An unexpected error occurred'
  },

  // Check if error is network related
  isNetworkError(error: unknown): boolean {
    return error instanceof TypeError || 
           (error instanceof Error && error.message.includes('fetch'))
  },

  // Check if error requires authentication
  isAuthError(error: unknown): boolean {
    return error instanceof ApiError && error.status === 401
  },

  // Retry with exponential backoff
  async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error

        if (attempt === maxRetries) {
          break
        }

        // Don't retry on client errors
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          throw error
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }
}

// Export all API modules
export default {
  auth: authApi,
  users: usersApi,
  tokens: tokensApi,
  knowledgeBase: knowledgeBaseApi,
  analytics: analyticsApi,
  reports: reportsApi,
  system: systemApi,
  utils: apiUtils
}
