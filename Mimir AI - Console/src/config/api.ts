// API Configuration - Easy to modify endpoints for Firebase integration
// Your friend can update these endpoints when implementing Firebase Functions

export const API_CONFIG = {
  // Base URL - Update this to your Firebase Functions URL
  BASE_URL: <BASE URL>,
  
  // Timeout settings
  TIMEOUT: 30000, // 30 seconds
  
  // Endpoints mapping - Easy to update
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/login',
      LOGOUT: '/auth/logout', 
      PROFILE: '/auth/profile',
      REFRESH: '/auth/refresh'
    },
    
    // User Management
    USERS: {
      LIST: '/users',
      GET: '/users/{id}',
      CREATE: '/users',
      UPDATE: '/users/{id}',
      DELETE: '/users/{id}'
    },
    
    // API Token Management
    TOKENS: {
      LIST: '/tokens',
      GET: '/tokens/{id}',
      CREATE: '/tokens',
      UPDATE: '/tokens/{id}',
      DELETE: '/tokens/{id}',
      ROTATE: '/tokens/{id}/rotate'
    },
    
    // Knowledge Base & Documents
    KNOWLEDGE_BASE: {
      SECTORS: '/knowledge-base/sectors',
      SECTOR_CREATE: '/knowledge-base/sectors',
      SECTOR_UPDATE: '/knowledge-base/sectors/{id}',
      DOCUMENTS: '/knowledge-base/documents',
      DOCUMENT_GET: '/knowledge-base/documents/{id}',
      DOCUMENT_UPLOAD: '/knowledge-base/documents/upload',
      DOCUMENT_BULK_UPLOAD: '/knowledge-base/documents/bulk-upload',
      DOCUMENT_UPDATE: '/knowledge-base/documents/{id}',
      DOCUMENT_DELETE: '/knowledge-base/documents/{id}',
      DOCUMENT_DOWNLOAD: '/knowledge-base/documents/{id}/download'
    },
    
    // Analytics
    ANALYTICS: {
      DASHBOARD: '/dashboard-analytics/{admin_email}',
      DEPARTMENTS: '/department-analytics/{admin_email}',
      USERS: '/user-analytics/{admin_email}',
      TOKENS: '/analytics/tokens',
      REPORTS_DATA: '/reports-data/{admin_email}',
      UPDATE_SATISFACTION: '/update-satisfaction'
    },
    
    // Reports
    REPORTS: {
      GENERATE: '/reports/generate',
      GET: '/reports/{id}',
      LIST: '/reports',
      DOWNLOAD: '/reports/{id}/download'
    },
    
    // System Management
    SYSTEM: {
      SETTINGS: '/system/settings',
      HEALTH: '/system/health',
      AUDIT_LOGS: '/system/audit-logs'
    }
  }
}

// Helper function to build URLs with parameters
export const buildUrl = (endpoint: string, params: Record<string, string> = {}): string => {
  let url = endpoint
  
  // Replace path parameters (e.g., {id} with actual values)
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`{${key}}`, value)
  })
  
  return url
}

// Helper function to get full API URL
export const getFullUrl = (endpoint: string, pathParams: Record<string, string> = {}): string => {
  const url = buildUrl(endpoint, pathParams)
  return `${API_CONFIG.BASE_URL}${url}`
}

// Export for easy access
export default API_CONFIG
