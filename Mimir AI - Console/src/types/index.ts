// Global TypeScript interfaces and types for the Metahuman Admin Console
// These interfaces ensure type safety across the entire application

// =====================================================
// API Response Types
// =====================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// =====================================================
// Authentication & User Management
// =====================================================

export interface User {
  id: string
  employeeId: string
  name: string
  email: string
  department: string
  role: 'super_admin' | 'hr_admin' | 'department_head' | 'user'
  avatar?: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
  expiresAt: string
}

// =====================================================
// API Token Management
// =====================================================

export interface APIToken {
  id: string
  name: string
  token: string
  department: string
  assignedUser: string
  assignedUserId: string
  createdDate: string
  expiryDate: string
  status: 'active' | 'expired' | 'revoked' | 'suspended'
  lastUsed?: string
  contextRetention: boolean
  permissions: TokenPermissions
  usage: TokenUsage
  securitySettings: TokenSecuritySettings
  metadata?: Record<string, any>
}

export interface TokenPermissions {
  level: 'full_access' | 'read_only' | 'limited_access'
  allowedEndpoints: string[]
  rateLimits: {
    requestsPerMinute: number
    requestsPerHour: number
    requestsPerDay: number
  }
  ipRestrictions?: string[]
  timeRestrictions?: {
    allowedHours: string[]
    timezone: string
  }
}

export interface TokenUsage {
  totalRequests: number
  monthlyRequests: number
  weeklyRequests: number
  dailyRequests: number
  lastRequestAt?: string
  averageResponseTime: number
  errorRate: number
}

export interface TokenSecuritySettings {
  encryption: boolean
  mfaRequired: boolean
  sessionTimeout: number
  maxConcurrentSessions: number
  auditLogging: boolean
}

export interface CreateTokenRequest {
  name: string
  department: string
  assignedUserId: string
  expiryDays: number
  contextRetention: boolean
  permissions: Partial<TokenPermissions>
  securitySettings?: Partial<TokenSecuritySettings>
}

// =====================================================
// Knowledge Base & Document Management
// =====================================================

export interface KnowledgeDocument {
  id: string
  name: string
  originalName: string
  type: DocumentType
  size: string
  sizeBytes: number
  uploadDate: string
  lastModified: string
  sector: string
  department: string
  uploadedBy: string
  uploadedByUser: User
  status: DocumentStatus
  description: string
  tags: string[]
  accessLevel: AccessLevel
  tokenId?: string
  usage: DocumentUsage
  metadata: DocumentMetadata
  versions: DocumentVersion[]
}

export type DocumentType = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'txt' | 'md' | 'image' | 'video' | 'audio' | 'zip' | 'other'

export type DocumentStatus = 'active' | 'inactive' | 'processing' | 'error' | 'archived'

export type AccessLevel = 'public' | 'department' | 'restricted' | 'confidential'

export interface DocumentUsage {
  queries: number
  monthlyQueries: number
  lastAccessed?: string
  averageRelevanceScore: number
  topQuestions: string[]
}

export interface DocumentMetadata {
  extractedText?: string
  language: string
  keywords: string[]
  pageCount?: number
  duration?: number // for video/audio files
  checksum: string
  mimeType: string
}

export interface DocumentVersion {
  id: string
  version: string
  uploadDate: string
  uploadedBy: string
  changes: string
  size: string
  isActive: boolean
}

export interface Sector {
  id: string
  name: string
  departments: string[]
  documentCount: number
  tokenId?: string
  status: 'active' | 'inactive' | 'setup_pending'
  description: string
  adminUsers: string[]
  settings: SectorSettings
  analytics: SectorAnalytics
}

export interface SectorSettings {
  autoTokenGeneration: boolean
  documentAutoTagging: boolean
  accessControl: {
    requireApproval: boolean
    allowedFileTypes: DocumentType[]
    maxFileSize: number
  }
  notifications: {
    newDocuments: boolean
    tokenUsage: boolean
    securityAlerts: boolean
  }
}

export interface SectorAnalytics {
  totalQueries: number
  monthlyQueries: number
  averageResponseTime: number
  satisfactionScore: number
  topTopics: string[]
  usageGrowth: number
}

// =====================================================
// Analytics & Metrics
// =====================================================

export interface DepartmentMetrics {
  name: string
  totalQueries: number
  avgResponseTime: number
  satisfactionScore: number
  documentsProcessed: number
  topicsCovered: number
  activeUsers: number
  peakHours: string[]
  growth: number
  efficiency: number
  trends: MetricTrend[]
  details: DepartmentDetails
}

export interface MetricTrend {
  date: string
  value: number
  change: number
  changeType: 'increase' | 'decrease' | 'stable'
}

export interface DepartmentDetails {
  topUsers: UserEngagementSummary[]
  commonQueries: QueryPattern[]
  satisfactionBreakdown: SatisfactionMetrics
  performanceIssues: PerformanceIssue[]
}

export interface UserEngagementSummary {
  userId: string
  name: string
  totalQueries: number
  avgSatisfaction: number
  lastActive: string
}

export interface QueryPattern {
  query: string
  frequency: number
  avgResponseTime: number
  satisfactionScore: number
  category: string
}

export interface SatisfactionMetrics {
  excellent: number // 5 stars
  good: number     // 4 stars
  average: number  // 3 stars
  poor: number     // 2 stars
  terrible: number // 1 star
}

export interface PerformanceIssue {
  type: 'slow_response' | 'low_satisfaction' | 'high_error_rate'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  affectedQueries: number
  suggestedAction: string
}

export interface UserAnalytics {
  id: string
  employeeId: string
  name: string
  department: string
  totalQueries: number
  lastActive: string
  trend: TrendDirection
  trendPercent: number
  avgResponseTime: string
  satisfactionScore: number
  engagementLevel: EngagementLevel
  queryCategories: QueryCategoryBreakdown[]
  activityHeatmap: ActivityPattern[]
}

export type TrendDirection = 'up' | 'down' | 'stable'
export type EngagementLevel = 'high' | 'medium' | 'low' | 'inactive'

export interface QueryCategoryBreakdown {
  category: string
  count: number
  percentage: number
  avgSatisfaction: number
}

export interface ActivityPattern {
  hour: number
  day: string
  queries: number
  intensity: 'low' | 'medium' | 'high'
}

export interface TimeSeriesData {
  date: string
  queries: number
  satisfaction: number
  responseTime: number
  newDocuments: number
  activeUsers: number
  errorRate: number
}

// =====================================================
// System Settings & Configuration
// =====================================================

export interface SystemSettings {
  general: GeneralSettings
  security: SecuritySettings
  notifications: NotificationSettings
  backup: BackupSettings
  integration: IntegrationSettings
}

export interface GeneralSettings {
  organizationName: string
  adminEmail: string
  timezone: string
  dateFormat: string
  language: string
  maintenanceMode: boolean
  debugMode: boolean
}

export interface SecuritySettings {
  mfaRequired: boolean
  sessionTimeout: number
  passwordPolicy: PasswordPolicy
  ipWhitelist: string[]
  rateLimiting: RateLimitSettings
  auditLogging: boolean
}

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  expiryDays: number
}

export interface RateLimitSettings {
  enabled: boolean
  requestsPerMinute: number
  requestsPerHour: number
  blockDuration: number
}

export interface NotificationSettings {
  email: boolean
  slack: boolean
  webhook: boolean
  alertThresholds: {
    errorRate: number
    responseTime: number
    diskUsage: number
    activeUsers: number
  }
}

export interface BackupSettings {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  retention: number
  location: string
  encryption: boolean
}

export interface IntegrationSettings {
  gailSystems: {
    hrms: boolean
    erp: boolean
    directory: boolean
  }
  apis: {
    chatbot: string
    analytics: string
    storage: string
  }
  webhooks: WebhookConfig[]
}

export interface WebhookConfig {
  id: string
  name: string
  url: string
  events: string[]
  active: boolean
  secret: string
}

// =====================================================
// Error Handling & Loading States
// =====================================================

export interface ErrorState {
  hasError: boolean
  error: AppError | null
  errorId?: string
}

export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: string
  stack?: string
  userMessage: string
  retryable: boolean
}

export interface LoadingState {
  [key: string]: boolean
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  timestamp: string
  actions?: ToastAction[]
}

export interface ToastAction {
  label: string
  action: () => void
}

// =====================================================
// Search & Filtering
// =====================================================

export interface SearchFilters {
  query?: string
  department?: string
  dateRange?: DateRange
  status?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface DateRange {
  start: string
  end: string
}

export interface SearchResult<T> {
  items: T[]
  total: number
  facets: SearchFacet[]
  suggestions: string[]
}

export interface SearchFacet {
  name: string
  values: FacetValue[]
}

export interface FacetValue {
  value: string
  count: number
  selected: boolean
}

// =====================================================
// Reports & Export
// =====================================================

export interface ReportRequest {
  type: ReportType
  format: ExportFormat
  dateRange: DateRange
  filters: Record<string, any>
  recipients?: string[]
  schedule?: ReportSchedule
}

export type ReportType = 'user_analytics' | 'department_metrics' | 'token_usage' | 'document_analytics' | 'security_audit'
export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json'

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly'
  dayOfWeek?: number
  dayOfMonth?: number
  time: string
  timezone: string
}

export interface GeneratedReport {
  id: string
  type: ReportType
  format: ExportFormat
  status: 'generating' | 'completed' | 'failed'
  downloadUrl?: string
  createdAt: string
  expiresAt: string
  size?: string
  error?: string
}

// =====================================================
// Theme & UI Preferences
// =====================================================

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'system'
  primaryColor: string
  fontSize: 'small' | 'medium' | 'large'
  compactMode: boolean
  animations: boolean
  sidebarCollapsed: boolean
}

export interface UserPreferences {
  theme: ThemeSettings
  dashboard: DashboardPreferences
  notifications: UserNotificationPreferences
  accessibility: AccessibilitySettings
}

export interface DashboardPreferences {
  layout: 'grid' | 'list'
  widgets: DashboardWidget[]
  refreshInterval: number
}

export interface DashboardWidget {
  id: string
  type: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  config: Record<string, any>
  visible: boolean
}

export interface UserNotificationPreferences {
  email: boolean
  push: boolean
  desktop: boolean
  sound: boolean
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}

export interface AccessibilitySettings {
  highContrast: boolean
  reducedMotion: boolean
  screenReader: boolean
  keyboardNavigation: boolean
  fontSize: number
}

// =====================================================
// Audit & Compliance
// =====================================================

export interface AuditLog {
  id: string
  timestamp: string
  userId: string
  userName: string
  action: string
  resource: string
  resourceId: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  outcome: 'success' | 'failure'
  risk: 'low' | 'medium' | 'high'
}

export interface ComplianceReport {
  id: string
  period: DateRange
  metrics: ComplianceMetrics
  violations: ComplianceViolation[]
  recommendations: string[]
  generatedAt: string
}

export interface ComplianceMetrics {
  dataAccess: number
  unauthorizedAttempts: number
  passwordChanges: number
  tokenRotations: number
  documentAccess: number
}

export interface ComplianceViolation {
  type: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
  userId: string
  resolved: boolean
  resolution?: string
}

// =====================================================
// Utility Types
// =====================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] }

// Common event handlers
export type EventHandler<T = any> = (event: T) => void
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>

// API endpoint configurations
export interface ApiEndpoint {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  timeout?: number
  retries?: number
}

// Feature flags
export interface FeatureFlags {
  enableAdvancedAnalytics: boolean
  enableRealTimeNotifications: boolean
  enableBulkOperations: boolean
  enableDocumentVersioning: boolean
  enableAuditTrail: boolean
  enableMobileApp: boolean
}
