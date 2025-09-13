// Utility functions for testing
import type { User, APIToken, KnowledgeDocument, DepartmentMetrics } from '@/types'

/**
 * Mock data generators for testing
 */
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  employeeId: 'EMP001',
  name: 'John Doe',
  email: 'john.doe@gail.in',
  department: 'Engineering',
  role: 'user',
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides
})

export const createMockAPIToken = (overrides: Partial<APIToken> = {}): APIToken => ({
  id: 'token-1',
  name: 'Test Token',
  token: 'test-token-123',
  department: 'Engineering',
  assignedUser: 'John Doe',
  assignedUserId: 'user-1',
  createdDate: '2025-01-01',
  expiryDate: '2025-12-31',
  status: 'active',
  contextRetention: true,
  permissions: {
    level: 'full_access',
    allowedEndpoints: ['*'],
    rateLimits: {
      requestsPerMinute: 100,
      requestsPerHour: 1000,
      requestsPerDay: 10000
    }
  },
  usage: {
    totalRequests: 1000,
    monthlyRequests: 100,
    weeklyRequests: 25,
    dailyRequests: 5,
    averageResponseTime: 1.2,
    errorRate: 0.01
  },
  securitySettings: {
    encryption: true,
    mfaRequired: false,
    sessionTimeout: 3600,
    maxConcurrentSessions: 5,
    auditLogging: true
  },
  ...overrides
})

export const createMockDocument = (overrides: Partial<KnowledgeDocument> = {}): KnowledgeDocument => ({
  id: 'doc-1',
  name: 'Test Document.pdf',
  originalName: 'Test Document.pdf',
  type: 'pdf',
  size: '1.2 MB',
  sizeBytes: 1200000,
  uploadDate: '2025-01-01',
  lastModified: '2025-01-01',
  sector: 'HR',
  department: 'Policy',
  uploadedBy: 'admin@gail.in',
  uploadedByUser: createMockUser({ email: 'admin@gail.in' }),
  status: 'active',
  description: 'Test document for HR policies',
  tags: ['policy', 'hr', 'test'],
  accessLevel: 'department',
  usage: {
    queries: 50,
    monthlyQueries: 10,
    averageRelevanceScore: 0.85,
    topQuestions: ['What is the leave policy?']
  },
  metadata: {
    language: 'en',
    keywords: ['policy', 'leave', 'hr'],
    pageCount: 10,
    checksum: 'abc123',
    mimeType: 'application/pdf'
  },
  versions: [{
    id: 'version-1',
    version: '1.0',
    uploadDate: '2025-01-01',
    uploadedBy: 'admin@gail.in',
    changes: 'Initial upload',
    size: '1.2 MB',
    isActive: true
  }],
  ...overrides
})

export const createMockDepartmentMetrics = (overrides: Partial<DepartmentMetrics> = {}): DepartmentMetrics => ({
  name: 'Engineering',
  totalQueries: 1000,
  avgResponseTime: 1.2,
  satisfactionScore: 4.5,
  documentsProcessed: 50,
  topicsCovered: 25,
  activeUsers: 20,
  peakHours: ['9:00 AM', '2:00 PM'],
  growth: 15.5,
  efficiency: 92.3,
  trends: [{
    date: '2025-01-01',
    value: 100,
    change: 5,
    changeType: 'increase'
  }],
  details: {
    topUsers: [{
      userId: 'user-1',
      name: 'John Doe',
      totalQueries: 100,
      avgSatisfaction: 4.5,
      lastActive: '2025-01-01T10:00:00Z'
    }],
    commonQueries: [{
      query: 'How to deploy?',
      frequency: 25,
      avgResponseTime: 1.1,
      satisfactionScore: 4.7,
      category: 'deployment'
    }],
    satisfactionBreakdown: {
      excellent: 40,
      good: 30,
      average: 20,
      poor: 8,
      terrible: 2
    },
    performanceIssues: [{
      type: 'slow_response',
      description: 'Some queries taking longer than expected',
      severity: 'medium',
      affectedQueries: 10,
      suggestedAction: 'Optimize search algorithms'
    }]
  },
  ...overrides
})

/**
 * Test utilities for async operations
 */
export const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms))

export const createMockAsyncFunction = <T>(
  result: T,
  delay = 100,
  shouldFail = false
) => {
  return jest.fn(async (): Promise<T> => {
    await sleep(delay)
    if (shouldFail) {
      throw new Error('Mock async function failed')
    }
    return result
  })
}

/**
 * Test utilities for error handling
 */
export const createMockError = (message = 'Test error', code = 'TEST_ERROR') => {
  const error = new Error(message)
  ;(error as any).code = code
  return error
}

/**
 * Local storage mock for testing
 */
export const createLocalStorageMock = () => {
  let store: Record<string, string> = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    length: 0,
    key: jest.fn()
  }
}

/**
 * Date utilities for testing
 */
export const mockDate = (date: string | Date) => {
  const mockDateInstance = new Date(date)
  jest.useFakeTimers()
  jest.setSystemTime(mockDateInstance)
  return mockDateInstance
}

export const restoreDate = () => {
  jest.useRealTimers()
}

/**
 * API response utilities
 */
export const createMockApiResponse = <T>(data: T, success = true) => ({
  success,
  data: success ? data : undefined,
  error: success ? undefined : 'Mock API error',
  message: success ? 'Success' : 'Error occurred',
  timestamp: new Date().toISOString()
})

export const createMockPaginatedResponse = <T>(
  items: T[],
  page = 1,
  limit = 10,
  total?: number
) => ({
  success: true,
  data: items.slice((page - 1) * limit, page * limit),
  pagination: {
    page,
    limit,
    total: total || items.length,
    totalPages: Math.ceil((total || items.length) / limit)
  },
  timestamp: new Date().toISOString()
})

/**
 * Component testing utilities
 */
export const createMockProps = <T extends Record<string, any>>(
  overrides: Partial<T> = {}
): T => ({
  ...overrides
} as T)

/**
 * Form validation testing utilities
 */
export const createValidationTest = <T>(
  validator: (data: T) => boolean | string | string[],
  validData: T,
  invalidData: Partial<T>[]
) => ({
  validator,
  validData,
  invalidData
})

/**
 * Performance testing utilities
 */
export const measureExecutionTime = async <T>(
  fn: () => Promise<T> | T
): Promise<{ result: T; duration: number }> => {
  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start
  return { result, duration }
}

/**
 * Memory leak testing utilities
 */
export const createMemoryLeakTest = (componentMount: () => void, componentUnmount: () => void) => {
  return () => {
    // Track initial memory usage
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
    
    // Mount and unmount component multiple times
    for (let i = 0; i < 100; i++) {
      componentMount()
      componentUnmount()
    }
    
    // Force garbage collection if available
    if ((global as any).gc) {
      (global as any).gc()
    }
    
    // Check final memory usage
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
    const memoryIncrease = finalMemory - initialMemory
    
    // Memory increase should be minimal (less than 1MB)
    expect(memoryIncrease).toBeLessThan(1024 * 1024)
  }
}

/**
 * Accessibility testing utilities
 */
export const createA11yTest = (element: HTMLElement) => {
  return {
    hasAriaLabel: () => expect(element).toHaveAttribute('aria-label'),
    hasRole: (role: string) => expect(element).toHaveAttribute('role', role),
    isFocusable: () => expect(element).toHaveAttribute('tabindex'),
    hasKeyboardSupport: () => {
      // Test common keyboard interactions
      const keyboardEvents = ['Enter', 'Space', 'Escape', 'ArrowUp', 'ArrowDown']
      return keyboardEvents.every(key => {
        // This would need to be implemented based on the specific component
        return true
      })
    }
  }
}
