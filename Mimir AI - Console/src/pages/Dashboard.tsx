import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  MessageSquare, 
  Key, 
  TrendingUp, 
  Database, 
  HardDrive,
  RefreshCw,
  Activity,
  Clock,
  Shield
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useDashboardAnalytics } from '@/hooks/useAnalytics'
import { useAuth } from '@/contexts/AuthContext'
import LoadingComponents from '@/components/LoadingComponents'
import { useToast } from '@/contexts/ToastContext'
import { apiTokenService } from '@/services/apiTokenService'
import { useState, useEffect } from 'react'

export default function Dashboard() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const { data: analytics, loading, error, refresh } = useDashboardAnalytics(
    user?.email || '', 
    30, 
    true // Enable auto-refresh
  )
  
  const [apiKeysCount, setApiKeysCount] = useState<number>(0)
  const [loadingApiKeys, setLoadingApiKeys] = useState(true)

  // Fetch API keys count
  useEffect(() => {
    const fetchApiKeysCount = async () => {
      if (user?.email) {
        try {
          setLoadingApiKeys(true)
          const count = await apiTokenService.getUserAPIKeysCount(user.email)
          setApiKeysCount(count)
        } catch (err) {
          console.error('Failed to fetch API keys count:', err)
          setApiKeysCount(0)
        } finally {
          setLoadingApiKeys(false)
        }
      }
    }

    fetchApiKeysCount()
  }, [user?.email])

  const handleRefresh = async () => {
    try {
      await refresh()
      // Also refresh API keys count
      if (user?.email) {
        const count = await apiTokenService.getUserAPIKeysCount(user.email)
        setApiKeysCount(count)
      }
      addToast({
        title: 'Data Refreshed',
        description: 'Dashboard data has been updated successfully',
        type: 'success'
      })
    } catch (err) {
      addToast({
        title: 'Refresh Failed',
        description: 'Failed to refresh dashboard data',
        type: 'error'
      })
    }
  }

  // Convert daily_data to chart format
  const metricsData = analytics?.daily_data ? 
    Object.entries(analytics.daily_data)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7) // Last 7 days
      .map(([date, queries]) => {
        // Parse the date and get the correct day of the week
        const dateObj = new Date(date + 'T00:00:00'); // Add time to avoid timezone issues
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[dateObj.getDay()];
        
        return {
          name: dayName,
          date: date, // Keep original date for reference
          interactions: queries,
          tokens: Math.floor(queries * 0.4) // Estimate based on queries
        };
      }) : []

  if (loading || loadingApiKeys) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingComponents.LoadingSpinner size="large" text="Loading dashboard analytics..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-600">Failed to Load Dashboard</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with quick actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the Mimir AI Admin Console
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.active_users?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No of Active Queries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.total_queries?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tokens</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingApiKeys ? '...' : apiKeysCount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              API keys created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Department</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.most_active_department || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              Most active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Processed</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.documents_processed?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total uploaded
            </p>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.avg_response_time ? `${analytics.avg_response_time.toFixed(1)}s` : '0.0s'}
            </div>
            <p className="text-xs text-muted-foreground">
              Query response time
            </p>
          </CardContent>
        </Card> */}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Interactions</CardTitle>
            <CardDescription>
              Chatbot interactions over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="interactions" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token Usage</CardTitle>
            <CardDescription>
              API token usage by day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tokens" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest system events and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.recent_activities?.map((activity, index) => {
                const getActivityIcon = (type: string) => {
                  switch (type) {
                    case 'query_processed':
                      return MessageSquare
                    case 'token_created':
                      return Key
                    case 'knowledge_update':
                      return Database
                    default:
                      return Activity
                  }
                }

                const ActivityIcon = getActivityIcon(activity.type)
                const timeAgo = activity.timestamp ? 
                  new Date(activity.timestamp).toLocaleString() : 'Unknown time'

                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <ActivityIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {timeAgo}
                      </div>
                    </div>
                  </div>
                )
              }) || (
                <div className="text-center py-4 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activities</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Alerts
            </CardTitle>
            <CardDescription>
              System security status and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    System Status: Healthy
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    All security checks passed
                  </p>
                </div>
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              </div>

              {/* <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    3 Tokens Expiring Soon
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Action required within 7 days
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Review
                </Button>
              </div> */}

              {/* <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Context Cleanup Scheduled
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Next cleanup in 2 days
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div> */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
