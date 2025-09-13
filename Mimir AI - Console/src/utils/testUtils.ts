// Core utility functions for testing the Metahuman Admin Console

/**
 * Validation utilities
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateToken = (token: string): boolean => {
  // Token should be at least 20 characters and contain alphanumeric characters
  return token.length >= 20 && /^[a-zA-Z0-9_-]+$/.test(token)
}

export const validateDepartment = (department: string): boolean => {
  const validDepartments = [
    'Engineering',
    'Human Resources', 
    'Finance',
    'Operations',
    'Marketing',
    'IT',
    'Legal',
    'Admin'
  ]
  return validDepartments.includes(department)
}

export const validateFileType = (filename: string): boolean => {
  const allowedExtensions = [
    '.pdf', '.docx', '.xlsx', '.pptx', '.txt', '.md',
    '.jpg', '.jpeg', '.png', '.gif', '.bmp',
    '.mp4', '.avi', '.mov', '.wmv',
    '.mp3', '.wav', '.flac',
    '.zip', '.rar', '.7z'
  ]
  
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return allowedExtensions.includes(extension)
}

export const validateFileSize = (sizeInBytes: number, maxSizeInMB = 50): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  return sizeInBytes <= maxSizeInBytes
}

/**
 * Data formatting utilities
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatDate = (dateString: string, includeTime = false): string => {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid Date'
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  
  if (includeTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }
  
  return date.toLocaleDateString('en-US', options)
}

export const formatNumber = (num: number, decimals = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num)
}

export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%'
  const percentage = (value / total) * 100
  return `${percentage.toFixed(1)}%`
}

/**
 * Search and filter utilities
 */
export const searchInText = (text: string, query: string): boolean => {
  if (!query.trim()) return true
  return text.toLowerCase().includes(query.toLowerCase())
}

export const filterByDateRange = (
  date: string,
  startDate?: string,
  endDate?: string
): boolean => {
  const itemDate = new Date(date)
  
  if (startDate) {
    const start = new Date(startDate)
    if (itemDate < start) return false
  }
  
  if (endDate) {
    const end = new Date(endDate)
    if (itemDate > end) return false
  }
  
  return true
}

export const sortByField = <T>(
  array: T[],
  field: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[field]
    const bVal = b[field]
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * Security utilities
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim()
}

export const generateSecureToken = (length = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const maskSensitiveData = (data: string, visibleChars = 4): string => {
  if (data.length <= visibleChars) return data
  const masked = '*'.repeat(data.length - visibleChars)
  return masked + data.slice(-visibleChars)
}

/**
 * Performance utilities
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void => {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Analytics utilities
 */
export const calculateTrend = (current: number, previous: number): {
  direction: 'up' | 'down' | 'stable'
  percentage: number
} => {
  if (previous === 0) {
    return { direction: 'stable', percentage: 0 }
  }
  
  const change = ((current - previous) / previous) * 100
  
  if (Math.abs(change) < 0.1) {
    return { direction: 'stable', percentage: 0 }
  }
  
  return {
    direction: change > 0 ? 'up' : 'down',
    percentage: Math.abs(change)
  }
}

export const calculateAverage = (numbers: number[]): number => {
  if (numbers.length === 0) return 0
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
}

export const calculateMedian = (numbers: number[]): number => {
  if (numbers.length === 0) return 0
  
  const sorted = [...numbers].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }
  
  return sorted[middle]
}

/**
 * URL utilities
 */
export const buildUrlWithParams = (baseUrl: string, params: Record<string, any>): string => {
  const url = new URL(baseUrl)
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })
  
  return url.toString()
}

export const parseUrlParams = (url: string): Record<string, string> => {
  const urlObj = new URL(url)
  const params: Record<string, string> = {}
  
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value
  })
  
  return params
}

/**
 * Color utilities for charts and UI
 */
export const generateColorPalette = (count: number): string[] => {
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
  ]
  
  if (count <= colors.length) {
    return colors.slice(0, count)
  }
  
  // Generate additional colors if needed
  const additionalColors = []
  for (let i = colors.length; i < count; i++) {
    const hue = (i * 137.508) % 360 // Golden angle approximation
    additionalColors.push(`hsl(${hue}, 70%, 60%)`)
  }
  
  return [...colors, ...additionalColors]
}

/**
 * Accessibility utilities
 */
export const generateId = (prefix = 'id'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

export const getAriaLabel = (element: string, action?: string): string => {
  if (action) {
    return `${action} ${element}`
  }
  return element
}

/**
 * Error handling utilities
 */
export const createErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'An unexpected error occurred'
}

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('network') || 
           error.message.includes('fetch') ||
           error.message.includes('connection')
  }
  return false
}

/**
 * Local storage utilities with error handling
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value)
      return true
    } catch {
      return false
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  },
  
  clear: (): boolean => {
    try {
      localStorage.clear()
      return true
    } catch {
      return false
    }
  }
}

export default {
  validateEmail,
  validateToken,
  validateDepartment,
  validateFileType,
  validateFileSize,
  formatFileSize,
  formatDate,
  formatNumber,
  formatPercentage,
  searchInText,
  filterByDateRange,
  sortByField,
  sanitizeInput,
  generateSecureToken,
  maskSensitiveData,
  debounce,
  throttle,
  calculateTrend,
  calculateAverage,
  calculateMedian,
  buildUrlWithParams,
  parseUrlParams,
  generateColorPalette,
  generateId,
  getAriaLabel,
  createErrorMessage,
  isNetworkError,
  safeLocalStorage
}
