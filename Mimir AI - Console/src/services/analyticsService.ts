import { API_CONFIG, getFullUrl } from '@/config/api'

// Types for analytics data
export interface DashboardAnalytics {
  active_users: number
  total_queries: number
  active_tokens: number
  most_active_department: string
  documents_processed: number
  avg_response_time: number // Average response time in seconds
  daily_data: Record<string, number>
  recent_activities: Array<{
    type: string
    description: string
    timestamp: string
    user_email?: string
  }>
}

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
}

export interface DepartmentAnalytics {
  departmentMetrics: DepartmentMetrics[]
  timeSeriesData: Array<{
    date: string
    queries: number
    satisfaction: number
    responseTime: number
    newDocuments: number
  }>
  topicDistribution: Array<{
    name: string
    value: number
    color: string
  }>
  userEngagement: Array<{
    department: string
    engagement: number
    retention: number
    satisfaction: number
  }>
}

export interface UserData {
  id: string
  employeeId: string
  name: string
  department: string
  totalQueries: number
  lastActive: string
  trend: 'up' | 'down' | 'stable'
  trendPercent: number
  avgResponseTime: string
  satisfactionScore: number
}

export interface UserAnalytics {
  userData: UserData[]
  engagementData: Array<{
    name: string
    queries: number
    activeUsers: number
  }>
  topUsersData: Array<{
    name: string
    queries: number
  }>
}

export interface ReportData {
  id: string
  name: string
  type: 'usage' | 'analytics' | 'security' | 'performance'
  description: string
  lastGenerated: string
  size: string
  status: 'ready' | 'generating' | 'error'
  dataPoints: number
}

export interface ReportsData {
  reports: ReportData[]
  summary: {
    totalReports: number
    totalDataPoints: number
    lastUpdated: string
  }
}

class AnalyticsService {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token')
    
    console.log('Fetching URL:', url) // Debug log
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', // Add user agent
        ...options.headers,
      },
    })

    console.log('Response status:', response.status) // Debug log
    console.log('Response headers:', response.headers) // Debug log

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error response:', errorText) // Debug log
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`)
    }

    const responseText = await response.text()
    console.log('Response text:', responseText) // Debug log
    
    try {
      return JSON.parse(responseText)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Raw response:', responseText)
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}...`)
    }
  }

  private async fetchWithoutAuth(url: string, options: RequestInit = {}) {
    console.log('Fetching URL (no auth):', url) // Debug log
    
    // Add timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', // Add user agent
          ...options.headers,
        },
      })

      clearTimeout(timeoutId)
      console.log('Response status:', response.status) // Debug log

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText) // Debug log
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`)
      }

      const responseText = await response.text()
      console.log('Response text (first 200 chars):', responseText.substring(0, 200)) // Debug log
      
      if (!responseText.trim()) {
        throw new Error('Empty response from server')
      }
      
      try {
        return JSON.parse(responseText)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        console.error('Raw response:', responseText)
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}...`)
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout - please try again')
      }
      throw fetchError
    }
  }

  async getDashboardAnalytics(adminEmail: string, days: number = 30): Promise<DashboardAnalytics> {
    const url = getFullUrl(API_CONFIG.ENDPOINTS.ANALYTICS.DASHBOARD, { admin_email: adminEmail })
    return this.fetchWithoutAuth(`${url}?days=${days}`)
  }

  async getDepartmentAnalytics(adminEmail: string, days: number = 30): Promise<DepartmentAnalytics> {
    const encodedEmail = encodeURIComponent(adminEmail)
    const url = getFullUrl(API_CONFIG.ENDPOINTS.ANALYTICS.DEPARTMENTS, { admin_email: encodedEmail })
    
    // Retry mechanism for ngrok reliability
    let lastError: Error | null = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Attempt ${attempt}/3 for department analytics`)
        return await this.fetchWithoutAuth(`${url}?days=${days}`)
      } catch (error) {
        lastError = error as Error
        console.error(`Attempt ${attempt} failed:`, error)
        if (attempt < 3) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }
    
    throw lastError || new Error('All retry attempts failed')
  }

  async getUserAnalytics(
    adminEmail: string, 
    days: number = 30, 
    department: string = 'all'
  ): Promise<UserAnalytics> {
    const url = getFullUrl(API_CONFIG.ENDPOINTS.ANALYTICS.USERS, { admin_email: adminEmail })
    return this.fetchWithoutAuth(`${url}?days=${days}&department=${department}`)
  }

  async getReportsData(
    adminEmail: string, 
    reportType: string = 'all', 
    days: number = 30
  ): Promise<ReportsData> {
    const url = getFullUrl(API_CONFIG.ENDPOINTS.ANALYTICS.REPORTS_DATA, { admin_email: adminEmail })
    return this.fetchWithoutAuth(`${url}?report_type=${reportType}&days=${days}`)
  }

  async updateSatisfactionScore(queryId: string, score: number): Promise<{ message: string }> {
    const url = getFullUrl(API_CONFIG.ENDPOINTS.ANALYTICS.UPDATE_SATISFACTION)
    return this.fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify({
        query_id: queryId,
        score: score
      })
    })
  }
}

export const analyticsService = new AnalyticsService()
