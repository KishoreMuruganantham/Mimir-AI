import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Copy, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Download,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'
import { apiTokenService, type APITokenWithDetails } from '@/services/apiTokenService'

// Use the Firestore-compatible interface
interface APIToken extends APITokenWithDetails {
  contextRetention: boolean
  permissions: string
}

export default function APITokens() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedToken, setSelectedToken] = useState<APIToken | null>(null)
  const [tokensData, setTokensData] = useState<APIToken[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const { addToast } = useToast()
  const [newTokenPassword, setNewTokenPassword] = useState('')
  const [newTokenLoading, setNewTokenLoading] = useState(false)
  const [newTokenError, setNewTokenError] = useState('')
  const [newTokenName, setNewTokenName] = useState('')
  const [newTokenDepartment, setNewTokenDepartment] = useState('')
  const { user } = useAuth()

  // Load tokens from Firestore
  const loadTokensFromFirestore = async () => {
    if (!user?.email) return
    
    try {
      setRefreshing(true)
      const firestoreTokens = await apiTokenService.getUserAPIKeys(user.email)
      const tokensWithDetails = apiTokenService.convertToDisplayFormat(firestoreTokens, user.email)
      
      // Convert to the expected format for the UI
      const convertedTokens: APIToken[] = tokensWithDetails.map((token) => ({
        ...token,
        contextRetention: false,
        permissions: '-'
      }))
      
      setTokensData(convertedTokens)
    } catch (error) {
      console.error('Error loading tokens from Firestore:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load API tokens from Firestore',
        type: 'error'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadTokensFromFirestore()
  }, [user?.email])

  // Load from localStorage as fallback
  useEffect(() => {
    const storedTokens = localStorage.getItem('apiTokens')
    if (storedTokens && tokensData.length === 0) {
      const parsedTokens = JSON.parse(storedTokens)
      const initialTokens: APIToken[] = parsedTokens.map((token: { token: string; name: string; department: string }, index: number) => ({
        id: `local_${Date.now()}_${index}`,
        name: token.name,
        department: token.department || '-',
        assignedUser: user?.email || '-',
        created_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        expiry_date: '30 days',
        last_accessed_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'active' as const,
        contextRetention: false,
        permissions: '-',
        token: token.token
      }))
      setTokensData(prevTokens => [...prevTokens, ...initialTokens])
    }
  }, [user?.email, tokensData.length])

  // Available departments
  const departments = [
    'Engineering',
    'Marketing',
    'Human Resources',
    'Finance',
    'Operations',
    'Sales',
    'Legal',
    'IT'
  ]

  const filteredTokens = tokensData.filter(token => {
    const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.assignedUser.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || token.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const toggleTokenVisibility = (id: string) => {
    const newVisible = new Set(visibleTokens)
    if (newVisible.has(id)) {
      newVisible.delete(id)
    } else {
      newVisible.add(id)
    }
    setVisibleTokens(newVisible)
  }

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    addToast({
      title: 'Token Copied',
      description: 'API token has been copied to clipboard',
      type: 'success'
    })
  }

  const handleEditToken = (token: APIToken) => {
    setSelectedToken(token)
    setShowEditModal(true)
  }

  const handleDeleteToken = async (token: APIToken) => {
    setSelectedToken(token)
    setShowDeleteDialog(true)
  }

  const confirmDeleteToken = async () => {
    if (selectedToken && user?.email) {
      try {
        // Remove from Firestore
        if (selectedToken.token) {
          await apiTokenService.removeTokenFromUser(user.email, selectedToken.token)
        }
        
        // Remove from local state
        setTokensData(prev => prev.filter(token => token.id !== selectedToken.id))
        
        // Remove from localStorage
        if (selectedToken.token) {
          const storedTokens = localStorage.getItem('apiTokens')
          if (storedTokens) {
            const existingTokens = JSON.parse(storedTokens)
            const updatedTokens = existingTokens.filter((t: { token: string }) => t.token !== selectedToken.token)
            localStorage.setItem('apiTokens', JSON.stringify(updatedTokens))
          }
        }
        
        addToast({
          title: 'Token Deleted',
          description: `${selectedToken.name} has been permanently deleted from Firestore`,
          type: 'success'
        })
      } catch (error) {
        addToast({
          title: 'Error',
          description: 'Failed to delete token from Firestore',
          type: 'error'
        })
      } finally {
        setShowDeleteDialog(false)
        setSelectedToken(null)
      }
    }
  }

  const exportTokensReport = () => {
    // Create CSV data
    const csvHeaders = ['Name', 'Department', 'Assigned User', 'Status', 'Created Date', 'Expiry Date', 'Last Used', 'Permissions']
    const csvData = tokensData.map(token => [
      token.name,
      token.department,
      token.assignedUser,
      token.status,
      apiTokenService.formatDate(token.created_time),
      token.expiry_date,
      apiTokenService.formatDate(token.last_accessed_time),
      token.permissions
    ])

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `api_tokens_report_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    addToast({
      title: 'Report Exported',
      description: 'API tokens report has been downloaded as CSV',
      type: 'success'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'revoked':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const handleGenerateToken = async () => {
    setNewTokenLoading(true)
    setNewTokenError('')
    try {
      if (!user?.email) throw new Error('No user email found')
      
      // Use the new Firestore service to create token
      const result = await apiTokenService.createAPIToken(
        user.email, 
        newTokenPassword, 
        newTokenDepartment,
        newTokenName || 'API Token'
      )
      
      if (result.success && result.token) {
        const newToken: APIToken = {
          id: Date.now().toString(),
          name: newTokenName || 'API Token',
          department: newTokenDepartment,
          assignedUser: user.email,
          created_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
          expiry_date: '30 days',
          last_accessed_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: 'active',
          contextRetention: false,
          permissions: '-',
          token: result.token
        }

        setTokensData(prev => [newToken, ...prev])

        // Also save to localStorage for backward compatibility
        const storedTokens = localStorage.getItem('apiTokens')
        const existingTokens = storedTokens ? JSON.parse(storedTokens) : []
        const updatedTokens = [
          { 
            token: result.token, 
            name: newTokenName || 'API Token',
            department: newTokenDepartment
          },
          ...existingTokens
        ]
        localStorage.setItem('apiTokens', JSON.stringify(updatedTokens))
        
        setShowCreateModal(false)
        setNewTokenPassword('')
        setNewTokenName('')
        setNewTokenDepartment('')
        
        addToast({
          title: 'Token Created',
          description: 'API token generated and stored in Firestore successfully',
          type: 'success'
        })
      } else {
        throw new Error(result.message || 'Failed to create token')
      }
    } catch (error: any) {
      setNewTokenError('Failed to generate token. Please check credentials.')
      addToast({
        title: 'Error',
        description: 'Failed to generate token. Please check credentials.',
        type: 'error'
      })
    } finally {
      setNewTokenLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Token Management</h1>
          <p className="text-muted-foreground">
            Manage API tokens for chatbot access across departments. Tokens are stored in Firebase Firestore under your user document.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={loadTokensFromFirestore} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportTokensReport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate New Token
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tokens, departments, or users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tokens Table */}
      <Card>
        <CardHeader>
          <CardTitle>API Tokens ({filteredTokens.length})</CardTitle>
          <CardDescription>
            Manage and monitor API token usage and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Token Name</th>
                  <th className="text-left py-3 px-4 font-medium">Department</th>
                  <th className="text-left py-3 px-4 font-medium">Assigned User</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Expiry Date</th>
                  <th className="text-left py-3 px-4 font-medium">Last Used</th>
                  <th className="text-left py-3 px-4 font-medium">Context</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Loading tokens from Firestore...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTokens.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No API tokens found. Generate a new token to get started.
                    </td>
                  </tr>
                ) : (
                  filteredTokens.map((token) => (
                  <tr key={token.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{token.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          {visibleTokens.has(token.id) ? token.token : '••••••••••••••••'}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTokenVisibility(token.id)}
                          >
                            {visibleTokens.has(token.id) ? 
                              <EyeOff className="h-3 w-3" /> : 
                              <Eye className="h-3 w-3" />
                            }
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToken(token.token || '')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{token.department}</td>
                    <td className="py-3 px-4">{token.assignedUser}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(token.status)}`}>
                        {token.status.charAt(0).toUpperCase() + token.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {token.expiry_date}
                        {token.status === 'active' && token.expiry_date !== "30 days" && new Date(token.expiry_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{apiTokenService.formatDate(token.last_accessed_time)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${token.contextRetention ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm">
                          {token.contextRetention ? 'Retained' : 'Auto-delete'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditToken(token)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteToken(token)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Token Creation Modal would go here */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Generate New API Token</CardTitle>
              <CardDescription>
                Create a new API token for department access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Token Name</label>
                <input
                  type="text"
                  value={newTokenName}
                  onChange={e => setNewTokenName(e.target.value)}
                  placeholder="Enter token name"
                  className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">User Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring opacity-60 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Department</label>
                <select
                  value={newTokenDepartment}
                  onChange={e => setNewTokenDepartment(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">Select department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">User Password</label>
                <input
                  type="password"
                  value={newTokenPassword}
                  onChange={e => setNewTokenPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              {newTokenError && <div className="text-red-500 text-xs">{newTokenError}</div>}
            </CardContent>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerateToken} 
                disabled={newTokenLoading || !newTokenPassword || !newTokenName || !newTokenDepartment}
              >
                {newTokenLoading ? 'Generating...' : 'Generate Token'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Token Modal */}
      {showEditModal && selectedToken && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit API Token</CardTitle>
              <CardDescription>
                Modify token settings and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Token Name</label>
                <input
                  type="text"
                  defaultValue={selectedToken.name}
                  className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Department</label>
                <select 
                  defaultValue={selectedToken.department}
                  className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option>Engineering</option>
                  <option>Marketing</option>
                  <option>Human Resources</option>
                  <option>Finance</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Assigned User</label>
                <input
                  type="text"
                  defaultValue={selectedToken.assignedUser}
                  className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select 
                  defaultValue={selectedToken.status}
                  className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="active">Active</option>
                  <option value="revoked">Revoked</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="editContextRetention" 
                  defaultChecked={selectedToken.contextRetention}
                  className="rounded" 
                />
                <label htmlFor="editContextRetention" className="text-sm">
                  Delete conversation history on token expiry/revocation
                </label>
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                addToast({
                  title: 'Token Updated',
                  description: `${selectedToken.name} has been updated successfully`,
                  type: 'success'
                })
                setShowEditModal(false)
              }}>
                Update Token
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && selectedToken && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Delete API Token
              </CardTitle>
              <CardDescription>
                This action cannot be undone. This will permanently delete the API token.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="font-medium text-red-800 dark:text-red-200">
                  {selectedToken.name}
                </div>
                <div className="text-sm text-red-600 dark:text-red-300 mt-1">
                  Department: {selectedToken.department} | User: {selectedToken.assignedUser}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                All associated conversation history and access permissions will be permanently removed.
              </p>
            </CardContent>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteToken}>
                Delete Token
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
