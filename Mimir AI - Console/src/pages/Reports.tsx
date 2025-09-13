import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Download, 
  FileText, 
  BarChart3, 
  Users, 
  MessageSquare,
  TrendingUp,
  Search,
  RefreshCw,
  Shield
} from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { useReportsData } from '@/hooks/useAnalytics'
import { useAuth } from '@/contexts/AuthContext'
import LoadingComponents from '@/components/LoadingComponents'

export default function Reports() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [selectedReportType, setSelectedReportType] = useState<string>('all')
  const [dateRange, setDateRange] = useState('30')
  const [isGenerating, setIsGenerating] = useState<Set<string>>(new Set())

  const { data: reportsData, loading, error, refresh } = useReportsData(
    user?.email || '',
    selectedReportType,
    parseInt(dateRange)
  )

  const handleRefresh = async () => {
    try {
      await refresh()
      addToast({
        title: 'Data Refreshed',
        description: 'Reports data has been updated successfully',
        type: 'success'
      })
    } catch (err) {
      addToast({
        title: 'Refresh Failed',
        description: 'Failed to refresh reports data',
        type: 'error'
      })
    }
  }

  const reportTemplates = reportsData?.reports || []

  const handleExportReport = async (reportId: string, format: 'pdf' | 'excel' | 'csv') => {
    const report = reportTemplates.find(r => r.id === reportId)
    if (!report) return

    setIsGenerating(prev => new Set(prev).add(reportId))

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create download link
      const blob = new Blob(['Sample report data'], { type: getContentType(format) })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      addToast({
        title: 'Report Exported',
        description: `${report.name} has been downloaded as ${format.toUpperCase()}`,
        type: 'success'
      })
    } catch (error) {
      addToast({
        title: 'Export Failed',
        description: 'Failed to export report. Please try again.',
        type: 'error'
      })
    } finally {
      setIsGenerating(prev => {
        const newSet = new Set(prev)
        newSet.delete(reportId)
        return newSet
      })
    }
  }

  const getContentType = (format: string) => {
    switch (format) {
      case 'pdf': return 'application/pdf'
      case 'excel': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      case 'csv': return 'text/csv'
      default: return 'application/octet-stream'
    }
  }

  const generateCustomReport = async () => {
    setIsGenerating(prev => new Set(prev).add('custom'))

    try {
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      addToast({
        title: 'Custom Report Generated',
        description: 'Your custom report has been generated successfully',
        type: 'success'
      })
    } catch (error) {
      addToast({
        title: 'Generation Failed',
        description: 'Failed to generate custom report. Please try again.',
        type: 'error'
      })
    } finally {
      setIsGenerating(prev => {
        const newSet = new Set(prev)
        newSet.delete('custom')
        return newSet
      })
    }
  }

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'usage': return <Users className="h-5 w-5 text-blue-500" />
      case 'analytics': return <BarChart3 className="h-5 w-5 text-green-500" />
      case 'security': return <Shield className="h-5 w-5 text-red-500" />
      case 'performance': return <TrendingUp className="h-5 w-5 text-purple-500" />
      default: return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  const filteredReports = reportTemplates.filter(report =>
    selectedReportType === 'all' || report.type === selectedReportType
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingComponents.LoadingSpinner size="large" text="Loading reports data..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-600">Failed to Load Reports</h2>
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
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate and export comprehensive reports on chatbot usage and performance
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isGenerating.has('custom')}
          >
            {isGenerating.has('custom') ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,847</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2s</div>
            <p className="text-xs text-muted-foreground">-12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Processed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">568</div>
            <p className="text-xs text-muted-foreground">+23% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  className="pl-10 pr-4 py-2 w-full border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Reports</option>
                <option value="usage">Usage Reports</option>
                <option value="analytics">Analytics</option>
                <option value="security">Security</option>
                <option value="performance">Performance</option>
              </select>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Reports ({filteredReports.length})</CardTitle>
          <CardDescription>
            Pre-generated reports ready for download and analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center space-x-4">
                  {getReportIcon(report.type)}
                  <div>
                    <h3 className="font-medium">{report.name}</h3>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                      <span>Last generated: {report.lastGenerated}</span>
                      <span>Size: {report.size}</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        report.status === 'ready' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        report.status === 'generating' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportReport(report.id, 'pdf')}
                    disabled={isGenerating.has(report.id) || report.status !== 'ready'}
                  >
                    {isGenerating.has(report.id) ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportReport(report.id, 'excel')}
                    disabled={isGenerating.has(report.id) || report.status !== 'ready'}
                  >
                    {isGenerating.has(report.id) ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportReport(report.id, 'csv')}
                    disabled={isGenerating.has(report.id) || report.status !== 'ready'}
                  >
                    {isGenerating.has(report.id) ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    CSV
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Report Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Report Builder</CardTitle>
          <CardDescription>
            Create custom reports with specific parameters and data ranges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <select className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option>Usage Analytics</option>
                <option>User Engagement</option>
                <option>Performance Metrics</option>
                <option>Security Audit</option>
                <option>Department Breakdown</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <select className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Custom range</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Export Format</label>
              <select className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option>PDF Report</option>
                <option>Excel Spreadsheet</option>
                <option>CSV Data</option>
                <option>JSON Data</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Button 
              onClick={generateCustomReport}
              disabled={isGenerating.has('custom')}
              className="w-full md:w-auto"
            >
              {isGenerating.has('custom') ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Generate & Download Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
