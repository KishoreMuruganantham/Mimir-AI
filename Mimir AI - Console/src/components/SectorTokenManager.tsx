import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Key, 
  Copy, 
  Eye, 
  EyeOff, 
  Settings, 
  Shield, 
  CheckCircle,
  AlertTriangle,
  Trash2,
  RotateCcw
} from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'

interface SectorToken {
  id: string
  sectorName: string
  tokenId: string
  status: 'active' | 'expired' | 'revoked'
  createdDate: string
  expiryDate: string
  lastUsed: string
  permissions: {
    readDocuments: boolean
    searchKnowledge: boolean
    generateReports: boolean
  }
  usage: {
    totalQueries: number
    monthlyQueries: number
    documentsAccessed: number
  }
  security: {
    ipRestrictions: string[]
    rateLimit: number
    encryption: boolean
  }
}

const mockSectorTokens: SectorToken[] = [
  {
    id: '1',
    sectorName: 'Human Resources',
    tokenId: 'gail_hr_2025_kb_token_001',
    status: 'active',
    createdDate: '2025-01-15',
    expiryDate: '2025-12-31',
    lastUsed: '2 hours ago',
    permissions: {
      readDocuments: true,
      searchKnowledge: true,
      generateReports: true
    },
    usage: {
      totalQueries: 3247,
      monthlyQueries: 456,
      documentsAccessed: 89
    },
    security: {
      ipRestrictions: ['192.168.1.0/24', '10.0.0.0/8'],
      rateLimit: 1000,
      encryption: true
    }
  },
  {
    id: '2',
    sectorName: 'Engineering',
    tokenId: 'gail_eng_2025_kb_token_001',
    status: 'active',
    createdDate: '2025-01-18',
    expiryDate: '2025-12-31',
    lastUsed: '1 day ago',
    permissions: {
      readDocuments: true,
      searchKnowledge: true,
      generateReports: false
    },
    usage: {
      totalQueries: 5691,
      monthlyQueries: 823,
      documentsAccessed: 156
    },
    security: {
      ipRestrictions: ['192.168.2.0/24'],
      rateLimit: 1500,
      encryption: true
    }
  },
  {
    id: '3',
    sectorName: 'Finance',
    tokenId: 'gail_fin_2025_kb_token_001',
    status: 'expired',
    createdDate: '2024-12-01',
    expiryDate: '2025-01-20',
    lastUsed: '3 days ago',
    permissions: {
      readDocuments: true,
      searchKnowledge: true,
      generateReports: true
    },
    usage: {
      totalQueries: 1892,
      monthlyQueries: 0,
      documentsAccessed: 67
    },
    security: {
      ipRestrictions: ['192.168.3.0/24'],
      rateLimit: 500,
      encryption: true
    }
  }
]

interface SectorTokenManagerProps {
  isOpen: boolean
  onClose: () => void
  sectorName?: string
}

export default function SectorTokenManager({ isOpen, onClose, sectorName }: SectorTokenManagerProps) {
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { addToast } = useToast()

  const filteredTokens = sectorName 
    ? mockSectorTokens.filter(token => token.sectorName === sectorName)
    : mockSectorTokens

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

  const generateNewToken = (sectorName: string) => {
    console.log(`Generating new token for ${sectorName}`)
    addToast({
      title: 'Token Generated',
      description: `New API token created for ${sectorName} sector`,
      type: 'success'
    })
    setShowCreateModal(false)
  }

  const revokeToken = (tokenId: string) => {
    console.log(`Revoking token: ${tokenId}`)
    addToast({
      title: 'Token Revoked',
      description: 'API token has been revoked',
      type: 'success'
    })
  }

  const renewToken = (tokenId: string) => {
    console.log(`Renewing token: ${tokenId}`)
    addToast({
      title: 'Token Renewed',
      description: 'API token has been renewed with new expiry date',
      type: 'success'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'revoked':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-background border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {sectorName ? `${sectorName} API Tokens` : 'Sector API Tokens'}
              </h2>
              <p className="text-muted-foreground">
                Manage knowledge base access tokens for organizational sectors
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowCreateModal(true)}>
                <Key className="mr-2 h-4 w-4" />
                Generate New Token
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Token Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredTokens.filter(t => t.status === 'active').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredTokens.reduce((sum, t) => sum + t.usage.totalQueries, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Documents Accessed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredTokens.reduce((sum, t) => sum + t.usage.documentsAccessed, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tokens List */}
          <div className="space-y-4">
            {filteredTokens.map((token) => (
              <Card key={token.id} className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{token.sectorName} Access Token</h3>
                      <p className="text-sm text-muted-foreground">
                        Created: {token.createdDate} • Expires: {token.expiryDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(token.status)}
                    <span className="text-sm font-medium capitalize">{token.status}</span>
                  </div>
                </div>

                {/* Token Details */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Usage Statistics</div>
                    <div className="text-xs text-muted-foreground">
                      <div>Queries: {token.usage.totalQueries.toLocaleString()}</div>
                      <div>This month: {token.usage.monthlyQueries}</div>
                      <div>Last used: {token.lastUsed}</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Permissions</div>
                    <div className="text-xs text-muted-foreground">
                      <div>Read: {token.permissions.readDocuments ? '✓' : '✗'}</div>
                      <div>Search: {token.permissions.searchKnowledge ? '✓' : '✗'}</div>
                      <div>Reports: {token.permissions.generateReports ? '✓' : '✗'}</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Security</div>
                    <div className="text-xs text-muted-foreground">
                      <div>Rate limit: {token.security.rateLimit}/hour</div>
                      <div>Encryption: {token.security.encryption ? 'Enabled' : 'Disabled'}</div>
                      <div>IP restrictions: {token.security.ipRestrictions.length}</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Token ID</div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {visibleTokens.has(token.id) 
                          ? token.tokenId 
                          : '●●●●●●●●●●●●●●●●●●●●'
                        }
                      </code>
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
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToken(token.tokenId)}
                  >
                    <Copy className="mr-2 h-3 w-3" />
                    Copy Token
                  </Button>
                  {token.status === 'expired' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => renewToken(token.id)}
                    >
                      <RotateCcw className="mr-2 h-3 w-3" />
                      Renew
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-3 w-3" />
                    Configure
                  </Button>
                  <Button variant="outline" size="sm">
                    <Shield className="mr-2 h-3 w-3" />
                    Security
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                    onClick={() => revokeToken(token.id)}
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Revoke
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Create Token Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Generate New API Token</CardTitle>
                <CardDescription>
                  Create a new access token for {sectorName || 'sector'} knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Token Name</label>
                  <input
                    type="text"
                    placeholder="e.g., HR Knowledge Access 2025"
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Expiry Date</label>
                  <input
                    type="date"
                    defaultValue="2025-12-31"
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Permissions</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      Read Documents
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      Search Knowledge Base
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      Generate Reports
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={() => generateNewToken(sectorName || 'Unknown')} className="flex-1">
                    <Key className="mr-2 h-4 w-4" />
                    Generate Token
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
