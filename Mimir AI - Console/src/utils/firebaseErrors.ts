// Firebase-specific error handling utilities
// This helps your friend understand and handle Firebase errors properly

export interface FirebaseErrorMapping {
  code: string
  message: string
  userMessage: string
  action?: string
}

// Common Firebase Auth error codes and user-friendly messages
export const AUTH_ERROR_MAPPINGS: Record<string, FirebaseErrorMapping> = {
  'auth/user-not-found': {
    code: 'USER_NOT_FOUND',
    message: 'No user found with this email address',
    userMessage: 'No account found with this email. Please check your email or contact your administrator.',
    action: 'check_email'
  },
  'auth/wrong-password': {
    code: 'INVALID_PASSWORD',
    message: 'Invalid password',
    userMessage: 'Incorrect password. Please try again.',
    action: 'retry_password'
  },
  'auth/invalid-email': {
    code: 'INVALID_EMAIL',
    message: 'Invalid email format',
    userMessage: 'Please enter a valid email address.',
    action: 'fix_email'
  },
  'auth/user-disabled': {
    code: 'USER_DISABLED',
    message: 'User account has been disabled',
    userMessage: 'Your account has been disabled. Please contact your administrator.',
    action: 'contact_admin'
  },
  'auth/too-many-requests': {
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many failed login attempts',
    userMessage: 'Too many failed attempts. Please try again later.',
    action: 'wait_retry'
  },
  'auth/network-request-failed': {
    code: 'NETWORK_ERROR',
    message: 'Network error occurred',
    userMessage: 'Connection problem. Please check your internet and try again.',
    action: 'check_connection'
  }
}

// Common Firestore error codes
export const FIRESTORE_ERROR_MAPPINGS: Record<string, FirebaseErrorMapping> = {
  'permission-denied': {
    code: 'PERMISSION_DENIED',
    message: 'Insufficient permissions',
    userMessage: 'You don\'t have permission to perform this action.',
    action: 'check_permissions'
  },
  'not-found': {
    code: 'NOT_FOUND',
    message: 'Document not found',
    userMessage: 'The requested item was not found.',
    action: 'refresh_page'
  },
  'already-exists': {
    code: 'ALREADY_EXISTS',
    message: 'Document already exists',
    userMessage: 'This item already exists.',
    action: 'use_different_name'
  },
  'resource-exhausted': {
    code: 'QUOTA_EXCEEDED',
    message: 'Quota exceeded',
    userMessage: 'Service temporarily unavailable. Please try again later.',
    action: 'retry_later'
  },
  'unauthenticated': {
    code: 'UNAUTHENTICATED',
    message: 'User not authenticated',
    userMessage: 'Please log in to continue.',
    action: 'login_required'
  }
}

// Storage error codes
export const STORAGE_ERROR_MAPPINGS: Record<string, FirebaseErrorMapping> = {
  'storage/object-not-found': {
    code: 'FILE_NOT_FOUND',
    message: 'File not found',
    userMessage: 'The requested file was not found.',
    action: 'check_file'
  },
  'storage/bucket-not-found': {
    code: 'BUCKET_NOT_FOUND',
    message: 'Storage bucket not found',
    userMessage: 'Storage service unavailable. Please try again later.',
    action: 'retry_later'
  },
  'storage/project-not-found': {
    code: 'PROJECT_NOT_FOUND',
    message: 'Project not found',
    userMessage: 'Service configuration error. Please contact support.',
    action: 'contact_support'
  },
  'storage/quota-exceeded': {
    code: 'STORAGE_QUOTA_EXCEEDED',
    message: 'Storage quota exceeded',
    userMessage: 'Storage limit reached. Please contact your administrator.',
    action: 'contact_admin'
  },
  'storage/unauthenticated': {
    code: 'STORAGE_UNAUTHENTICATED',
    message: 'User not authenticated for storage',
    userMessage: 'Please log in to upload files.',
    action: 'login_required'
  },
  'storage/unauthorized': {
    code: 'STORAGE_UNAUTHORIZED',
    message: 'Insufficient storage permissions',
    userMessage: 'You don\'t have permission to access this file.',
    action: 'check_permissions'
  }
}

// Function to map Firebase errors to user-friendly messages
export const mapFirebaseError = (error: any): FirebaseErrorMapping => {
  // Default error mapping
  const defaultError: FirebaseErrorMapping = {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'An unknown error occurred',
    userMessage: 'Something went wrong. Please try again or contact support.',
    action: 'retry'
  }

  if (!error || !error.code) {
    return defaultError
  }

  // Check Auth errors
  if (AUTH_ERROR_MAPPINGS[error.code]) {
    return AUTH_ERROR_MAPPINGS[error.code]
  }

  // Check Firestore errors
  if (FIRESTORE_ERROR_MAPPINGS[error.code]) {
    return FIRESTORE_ERROR_MAPPINGS[error.code]
  }

  // Check Storage errors
  if (STORAGE_ERROR_MAPPINGS[error.code]) {
    return STORAGE_ERROR_MAPPINGS[error.code]
  }

  // Return default if no mapping found
  return {
    ...defaultError,
    code: error.code,
    message: error.message
  }
}

// Helper function to check if an error is retryable
export const isRetryableError = (error: any): boolean => {
  const retryableCodes = [
    'auth/network-request-failed',
    'unavailable',
    'deadline-exceeded',
    'internal',
    'resource-exhausted'
  ]

  return retryableCodes.includes(error?.code)
}

// Helper function to get retry delay based on attempt number
export const getRetryDelay = (attempt: number): number => {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s (max)
  return Math.min(1000 * Math.pow(2, attempt), 16000)
}

// Logger utility for Firebase errors
export const logFirebaseError = (error: any, context: string): void => {
  const mappedError = mapFirebaseError(error)
  
  console.group(`🔥 Firebase Error in ${context}`)
  console.error('Original Error:', error)
  console.log('Mapped Error:', mappedError)
  console.log('User Message:', mappedError.userMessage)
  console.log('Suggested Action:', mappedError.action)
  console.groupEnd()
}

// Utility to create standardized error responses for API functions
export const createErrorResponse = (error: any, context?: string) => {
  const mappedError = mapFirebaseError(error)
  
  if (context) {
    logFirebaseError(error, context)
  }
  
  return {
    success: false,
    error: mappedError.code,
    message: mappedError.userMessage,
    details: {
      originalCode: error?.code,
      originalMessage: error?.message,
      action: mappedError.action
    },
    timestamp: new Date().toISOString()
  }
}

// Export everything for easy use
export default {
  mapFirebaseError,
  isRetryableError,
  getRetryDelay,
  logFirebaseError,
  createErrorResponse,
  AUTH_ERROR_MAPPINGS,
  FIRESTORE_ERROR_MAPPINGS,
  STORAGE_ERROR_MAPPINGS
}
