import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import {
  TrendingUp,
  Users,
  MessageSquare,
  Target,
  Zap,
  Brain,
  Activity,
  FileText,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Star,
  Award,
  Flame,
  ThumbsUp
} from 'lucide-react'
import { useDepartmentAnalytics } from '@/hooks/useAnalytics'
import { useAuth } from '@/contexts/AuthContext'
import LoadingComponents from '@/components/LoadingComponents'
import { useToast } from '@/contexts/ToastContext'

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00']

export default function DepartmentAnalytics() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('30')
  const [activeChart, setActiveChart] = useState<'overview' | 'trends' | 'topics' | 'engagement'>('overview')

  const { data: analytics, loading, error, refresh } = useDepartmentAnalytics(
    user?.email || '', 
    parseInt(timeRange)
  )

  const handleRefresh = async () => {
    try {
      await refresh()
      addToast({
        title: 'Data Refreshed',
        description: 'Department analytics data has been updated successfully',
        type: 'success'
      })
    } catch (err) {
      addToast({
        title: 'Refresh Failed',
        description: 'Failed to refresh department analytics data',
        type: 'error'
      })
    }
  }

  const departmentMetrics = analytics?.departmentMetrics || []
  const timeSeriesData = analytics?.timeSeriesData || []
  const topicDistribution = analytics?.topicDistribution || []

  // Create user engagement data from department metrics
  const userEngagementData = departmentMetrics.map(dept => ({
    department: dept.name,
    engagement: Math.min(100, Math.round(dept.efficiency || 80)),
    retention: Math.min(100, Math.round((dept.satisfactionScore / 5) * 100)),
    satisfaction: Math.min(100, Math.round((dept.satisfactionScore / 5) * 100))
  }))

  const filteredMetrics = selectedDepartment === 'all' 
    ? departmentMetrics 
    : departmentMetrics.filter(dept => dept.name === selectedDepartment)

  const totalQueries = departmentMetrics.reduce((sum, dept) => sum + dept.totalQueries, 0)
  const avgSatisfaction = departmentMetrics.length > 0 
    ? departmentMetrics.reduce((sum, dept) => sum + dept.satisfactionScore, 0) / departmentMetrics.length 
    : 0
  const totalDocuments = departmentMetrics.length > 0 ? departmentMetrics[0].documentsProcessed : 0
  const totalUsers = departmentMetrics.reduce((sum, dept) => sum + dept.activeUsers, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingComponents.LoadingSpinner size="large" text="Loading department analytics..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-600">Failed to Load Department Analytics</h2>
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Department Analytics</h1>
          <p className="text-muted-foreground">
            Deep insights into departmental AI assistant usage and performance
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Departments</option>
          {departmentMetrics.map(dept => (
            <option key={dept.name} value={dept.name}>{dept.name}</option>
          ))}
        </select>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="1">Last 24 Hours</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Advanced Filters
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQueries.toLocaleString()}</div>
            {/* <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12.5% from last period
            </p> */}
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSatisfaction.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +0.3 improvement
            </p>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Processed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocuments}</div>
            {/* <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +45 this month
            </p> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            {/* <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +23 new users
            </p> */}
          </CardContent>
        </Card>
      </div>

      {/* Chart Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeChart === 'overview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveChart('overview')}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Overview
        </Button>
        <Button
          variant={activeChart === 'trends' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveChart('trends')}
        >
          <LineChartIcon className="mr-2 h-4 w-4" />
          Trends
        </Button>
        {/* <Button
          variant={activeChart === 'topics' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveChart('topics')}
        >
          <PieChartIcon className="mr-2 h-4 w-4" />
          Topics
        </Button> */}
        {/* <Button
          variant={activeChart === 'engagement' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveChart('engagement')}
        >
          <Activity className="mr-2 h-4 w-4" />
          Engagement
        </Button> */}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6">
        {/* Overview Charts */}
        {activeChart === 'overview' && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
                <CardDescription>Queries, satisfaction, and efficiency metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filteredMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalQueries" fill="#8884d8" name="Total Queries" />
                    <Bar dataKey="efficiency" fill="#82ca9d" name="Efficiency %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trends Charts */}
        {activeChart === 'trends' && (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Trends Over Time</CardTitle>
                <CardDescription>Daily query volume trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="queries" stroke="#8884d8" strokeWidth={2} name="Daily Queries" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Growth Rate Analysis</CardTitle>
                  <CardDescription>Department-wise growth comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={filteredMetrics} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="growth" fill="#82ca9d" name="Growth %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Peak Usage Hours</CardTitle>
                  <CardDescription>Optimal support staffing insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredMetrics.map((dept) => (
                      <div key={dept.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{dept.name}</span>
                          <span className="text-sm text-muted-foreground">{dept.activeUsers} users</span>
                        </div>
                        <div className="flex gap-2">
                          {dept.peakHours.map((hour, index) => (
                            <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                              {hour}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Topics Distribution */}
        {/* {activeChart === 'topics' && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Query Topics Distribution</CardTitle>
                <CardDescription>What users are asking about most</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topicDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {topicDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Expertise Radar</CardTitle>
                <CardDescription>Multi-dimensional performance analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={userEngagementData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="department" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Engagement" dataKey="engagement" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Radar name="Retention" dataKey="retention" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                    <Radar name="Satisfaction" dataKey="satisfaction" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )} */}

        {/* User Engagement */}
        {/* {activeChart === 'engagement' && (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement Metrics</CardTitle>
                <CardDescription>Detailed user behavior and satisfaction analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={userEngagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="engagement" fill="#8884d8" name="Engagement Score" />
                    <Bar dataKey="retention" fill="#82ca9d" name="Retention Rate" />
                    <Bar dataKey="satisfaction" fill="#ffc658" name="Satisfaction Score" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              {filteredMetrics.map((dept) => (
                <Card key={dept.name}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{dept.name}</CardTitle>
                      <div className="flex items-center gap-1">
                        {dept.satisfactionScore >= 4.5 ? (
                          <Award className="h-5 w-5 text-yellow-500" />
                        ) : dept.satisfactionScore >= 4.0 ? (
                          <ThumbsUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <Flame className="h-5 w-5 text-orange-500" />
                        )}
                        <span className="text-sm font-medium">{dept.satisfactionScore}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Active Users</span>
                        <span className="font-medium">{dept.activeUsers}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Topics Covered</span>
                        <span className="font-medium">{dept.topicsCovered}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Avg Response</span>
                        <span className="font-medium">{dept.avgResponseTime}s</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Efficiency</span>
                        <span className="font-medium">{dept.efficiency}%</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground">Peak Hours</div>
                      <div className="flex gap-1 mt-1">
                        {dept.peakHours.map((hour, index) => (
                          <span key={index} className="px-2 py-1 bg-muted rounded text-xs">
                            {hour}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div> */}
      </div>

      {/* Additional Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* <Card>
          <CardHeader>
            <CardTitle>AI Performance Insights</CardTitle>
            <CardDescription>Key recommendations for optimization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <Brain className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium text-green-800">High Performing Sectors</div>
                <div className="text-sm text-green-700">Finance and HR showing excellent satisfaction scores above 4.7</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-800">Optimization Opportunity</div>
                <div className="text-sm text-yellow-700">Engineering department response time could be improved with additional training data</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Target className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-blue-800">Growth Potential</div>
                <div className="text-sm text-blue-700">Operations sector ready for token activation with 267 documents processed</div>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* <Card>
          <CardHeader>
            <CardTitle>Usage Patterns</CardTitle>
            <CardDescription>Behavioral insights and trends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Most Active Time</span>
                <span className="text-sm font-medium">10:00 AM - 11:00 AM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Busiest Department</span>
                <span className="text-sm font-medium">Engineering (28.9K queries)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Fastest Response</span>
                <span className="text-sm font-medium">Finance (0.9s avg)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Highest Growth</span>
                <span className="text-sm font-medium">Finance (+31.2%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">User Retention</span>
                <span className="text-sm font-medium">88% (7-day average)</span>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  )
}
