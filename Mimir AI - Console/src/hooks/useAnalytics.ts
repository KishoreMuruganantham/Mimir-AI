import { useState, useEffect, useCallback } from 'react'
import { analyticsService } from '@/services/analyticsService'
import type { DashboardAnalytics, DepartmentAnalytics, UserAnalytics, ReportsData } from '@/services/analyticsService'

interface UseAnalyticsOptions {
  adminEmail: string
  days?: number
  department?: string
  reportType?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useDashboardAnalytics(adminEmail: string, days: number = 30, autoRefresh: boolean = false) {
  const [data, setData] = useState<DashboardAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await analyticsService.getDashboardAnalytics(adminEmail, days)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard analytics')
      console.error('Dashboard analytics error:', err)
    } finally {
      setLoading(false)
    }
  }, [adminEmail, days])

  useEffect(() => {
    if (adminEmail) {
      fetchData()
    }
  }, [fetchData, adminEmail])

  useEffect(() => {
    if (autoRefresh && adminEmail) {
      const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh, fetchData, adminEmail])

  return { data, loading, error, refresh: fetchData }
}

export function useDepartmentAnalytics(adminEmail: string, days: number = 30) {
  const [data, setData] = useState<DepartmentAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await analyticsService.getDepartmentAnalytics(adminEmail, days)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch department analytics')
      console.error('Department analytics error:', err)
    } finally {
      setLoading(false)
    }
  }, [adminEmail, days])

  useEffect(() => {
    if (adminEmail) {
      fetchData()
    }
  }, [fetchData, adminEmail])

  return { data, loading, error, refresh: fetchData }
}

export function useUserAnalytics(adminEmail: string, days: number = 30, department: string = 'all') {
  const [data, setData] = useState<UserAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await analyticsService.getUserAnalytics(adminEmail, days, department)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user analytics')
      console.error('User analytics error:', err)
    } finally {
      setLoading(false)
    }
  }, [adminEmail, days, department])

  useEffect(() => {
    if (adminEmail) {
      fetchData()
    }
  }, [fetchData, adminEmail])

  return { data, loading, error, refresh: fetchData }
}

export function useReportsData(adminEmail: string, reportType: string = 'all', days: number = 30) {
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await analyticsService.getReportsData(adminEmail, reportType, days)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports data')
      console.error('Reports data error:', err)
    } finally {
      setLoading(false)
    }
  }, [adminEmail, reportType, days])

  useEffect(() => {
    if (adminEmail) {
      fetchData()
    }
  }, [fetchData, adminEmail])

  return { data, loading, error, refresh: fetchData }
}

export function useAnalytics(options: UseAnalyticsOptions) {
  const { adminEmail, days = 30, department = 'all', reportType = 'all', autoRefresh = false } = options

  const dashboard = useDashboardAnalytics(adminEmail, days, autoRefresh)
  const departments = useDepartmentAnalytics(adminEmail, days)
  const users = useUserAnalytics(adminEmail, days, department)
  const reports = useReportsData(adminEmail, reportType, days)

  const refreshAll = useCallback(async () => {
    await Promise.all([
      dashboard.refresh(),
      departments.refresh(),
      users.refresh(),
      reports.refresh()
    ])
  }, [dashboard.refresh, departments.refresh, users.refresh, reports.refresh])

  const isLoading = dashboard.loading || departments.loading || users.loading || reports.loading
  const hasError = dashboard.error || departments.error || users.error || reports.error

  return {
    dashboard: dashboard.data,
    departments: departments.data,
    users: users.data,
    reports: reports.data,
    loading: isLoading,
    error: hasError,
    refresh: refreshAll,
    refreshDashboard: dashboard.refresh,
    refreshDepartments: departments.refresh,
    refreshUsers: users.refresh,
    refreshReports: reports.refresh
  }
}
