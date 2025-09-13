import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  User,
  Shield,
  Globe,
  Database,
  Camera,
  Save,
  RefreshCw,
  Eye,
  Lock,
  Activity,
  BarChart3
} from 'lucide-react'

// Types for settings
interface UserSettings {
  profile: {
    name: string
    email: string
    avatar: string
    timezone: string
    language: string
    role: string
  }
  privacy: {
    analyticsTracking: boolean
    dataSharing: boolean
    profileVisibility: 'public' | 'private' | 'organization'
    activityStatus: boolean
  }
}

// Mock settings data
const defaultSettings: UserSettings = {
  profile: {
    name: 'Mukund Sharma',
    email: 'mukund.sharma@gail.in',
    avatar: '/avatars/mukund.jpg',
    timezone: 'Asia/Kolkata',
    language: 'English',
    role: 'System Administrator'
  },
  privacy: {
    analyticsTracking: true,
    dataSharing: false,
    profileVisibility: 'organization',
    activityStatus: true
  }
}

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const updateSettings = (section: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
    setHasUnsavedChanges(true)
  }

  const saveSettings = () => {
    // Simulate saving settings
    console.log('Saving settings:', settings)
    setHasUnsavedChanges(false)
    
    // Show success notification
    const celebration = document.createElement('div')
    celebration.innerHTML = '✅ Settings Saved Successfully!'
    celebration.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; font-weight: bold; z-index: 1000; animation: slideIn 0.3s ease-out;'
    document.body.appendChild(celebration)
    setTimeout(() => {
      if (document.body.contains(celebration)) {
        document.body.removeChild(celebration)
      }
    }, 3000)
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    setHasUnsavedChanges(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Customize your experience and manage your preferences
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={resetSettings}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset to Default
          </Button>
          <Button 
            onClick={saveSettings}
            disabled={!hasUnsavedChanges}
            className={hasUnsavedChanges ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            <Save className="mr-2 h-4 w-4" />
            {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
          </Button>
        </div>
      </div>

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-yellow-600" />
            <span className="text-yellow-800 font-medium">You have unsaved changes</span>
            <Button size="sm" onClick={saveSettings} className="ml-auto">
              Save Now
            </Button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="text-lg font-medium text-muted-foreground">
        Profile & Privacy Settings
      </div>

      {/* Combined Profile and Privacy Settings */}
      <div className="space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Manage your account details and personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {settings.profile.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">{settings.profile.name}</h3>
                <p className="text-muted-foreground">{settings.profile.email}</p>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  {settings.profile.role}
                </span>
              </div>
              <Button variant="outline" className="ml-auto">
                <Camera className="mr-2 h-4 w-4" />
                Change Photo
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={settings.profile.name}
                  onChange={(e) => updateSettings('profile', 'name', e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={settings.profile.email}
                  onChange={(e) => updateSettings('profile', 'email', e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Timezone</label>
                <select
                  value={settings.profile.timezone}
                  onChange={(e) => updateSettings('profile', 'timezone', e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select
                  value={settings.profile.language}
                  onChange={(e) => updateSettings('profile', 'language', e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="English">English</option>
                  <option value="Hindi">हिंदी</option>
                  <option value="Bengali">বাংলা</option>
                  <option value="Tamil">தமிழ்</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy & Security</CardTitle>
            <CardDescription>Control your privacy settings and data usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {[
                { 
                  key: 'analyticsTracking', 
                  label: 'Analytics Tracking', 
                  description: 'Help improve the service by sharing usage analytics',
                  icon: BarChart3 
                },
                { 
                  key: 'dataSharing', 
                  label: 'Data Sharing', 
                  description: 'Allow anonymized data to be used for research',
                  icon: Database 
                },
                { 
                  key: 'activityStatus', 
                  label: 'Activity Status', 
                  description: 'Show when you are online to other users',
                  icon: Activity 
                }
              ].map(({ key, label, description, icon: Icon }) => (
                <div key={key} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="font-medium block">{label}</span>
                      <span className="text-sm text-muted-foreground">{description}</span>
                    </div>
                  </div>
                  <button
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.privacy[key as keyof typeof settings.privacy] ? 'bg-primary' : 'bg-gray-300'
                    }`}
                    onClick={() => updateSettings('privacy', key, !settings.privacy[key as keyof typeof settings.privacy])}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.privacy[key as keyof typeof settings.privacy] ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium">Profile Visibility</label>
              <div className="space-y-2">
                {[
                  { value: 'public', label: 'Public', description: 'Visible to everyone', icon: Globe },
                  { value: 'organization', label: 'Organization', description: 'Visible to organization members', icon: User },
                  { value: 'private', label: 'Private', description: 'Only visible to you', icon: Lock }
                ].map(({ value, label, description, icon: Icon }) => (
                  <div
                    key={value}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${
                      settings.privacy.profileVisibility === value ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => updateSettings('privacy', 'profileVisibility', value)}
                  >
                    <Icon className="h-5 w-5" />
                    <div>
                      <span className="font-medium block">{label}</span>
                      <span className="text-sm text-muted-foreground">{description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Data Security</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your data is encrypted and stored securely. We follow industry-standard security practices to protect your information.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="px-6" onClick={() => {
          // Here you would normally save to backend
          console.log('Settings saved:', settings)
          alert('Settings saved successfully!')
        }}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

    </div>
  )
}
