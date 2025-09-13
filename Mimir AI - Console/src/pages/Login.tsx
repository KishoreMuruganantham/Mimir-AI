import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const { login, verifyOtp, isOtpStep, pendingEmail } = useAuth()
  const { addToast } = useToast()

  // Step 1: Password submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setOtpError('')
    try {
      const success = await login(email, password)
      if (!success) {
        addToast({
          title: 'Login Failed',
          description: 'Invalid email or password',
          type: 'error'
        })
      } else {
        addToast({
          title: 'OTP Sent',
          description: 'An OTP has been sent to your email.',
          type: 'info'
        })
      }
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'An error occurred during login',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: OTP submit
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpLoading(true)
    setOtpError('')
    try {
      const success = await verifyOtp(pendingEmail || email, otp)
      if (success) {
        addToast({
          title: 'Login Successful',
          description: 'Welcome to Mimir AI Admin Console',
          type: 'success'
        })
      } else {
        setOtpError('Invalid OTP. Please try again.')
        addToast({
          title: 'OTP Failed',
          description: 'Invalid OTP. Please try again.',
          type: 'error'
        })
      }
    } catch (error) {
      setOtpError('An error occurred during OTP verification.')
      addToast({
        title: 'Error',
        description: 'An error occurred during OTP verification',
        type: 'error'
      })
    } finally {
      setOtpLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* GAIL Logo and Branding */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mimir AI</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Mimir AI Admin Console</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              {isOtpStep ? 'Enter the OTP sent to your email' : 'Enter your credentials to access the admin console'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isOtpStep ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="admin@gail.in"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="otp" className="text-sm font-medium">
                    OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="Enter the OTP sent to your email"
                    required
                  />
                </div>
                {otpError && <div className="text-red-500 text-xs">{otpError}</div>}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={otpLoading}
                >
                  {otpLoading ? 'Verifying OTP...' : 'Verify OTP'}
                </Button>
              </form>
            )}

            {/* Link to Signup */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link 
                  to="/signup" 
                  className="font-medium text-primary hover:underline"
                >
                  Create one here
                </Link>
              </p>
            </div>

            {/* Security features placeholder */}
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Protected by enterprise security • Two-factor authentication enabled
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          © 2025 GAIL India Limited. All rights reserved.
        </p>
      </div>
    </div>
  )
}
