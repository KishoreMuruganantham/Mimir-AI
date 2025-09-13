import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '@/services/api'

interface User {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'hr_admin' | 'department_head'
  department?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isPostLoginLoading: boolean
  isOtpStep: boolean
  pendingEmail: string | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, username: string) => Promise<boolean>
  requestOtp: (email: string) => Promise<boolean>
  verifyOtp: (email: string, otp: string) => Promise<boolean>
  logout: () => void
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isPostLoginLoading, setIsPostLoginLoading] = useState(false)
  const [isOtpStep, setIsOtpStep] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('metahuman_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      setIsAuthenticated(true)
    }
  }, [])

  // Step 1: Password check, then trigger OTP step
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login(email, password)
      if (response.status) {
        // Password correct, trigger OTP step
        setIsOtpStep(true)
        setPendingEmail(email)
        await authApi.otpGenerator(email)
        return true
      } else {
        setIsAuthenticated(false)
        setIsOtpStep(false)
        setPendingEmail(null)
        return false
      }
    } catch (error) {
      setIsAuthenticated(false)
      setIsOtpStep(false)
      setPendingEmail(null)
      return false
    }
  }

  // Signup flow: create account, then trigger OTP step
  const signup = async (email: string, password: string, username: string): Promise<boolean> => {
    try {
      const response = await authApi.signup(email, password, username)
      if (response.status) {
        // Account created successfully, trigger OTP step
        setIsOtpStep(true)
        setPendingEmail(email)
        await authApi.otpGenerator(email)
        return true
      } else {
        setIsAuthenticated(false)
        setIsOtpStep(false)
        setPendingEmail(null)
        return false
      }
    } catch (error) {
      setIsAuthenticated(false)
      setIsOtpStep(false)
      setPendingEmail(null)
      return false
    }
  }

  // Step 2: OTP verification
  const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
    try {
      const response = await authApi.otpAuth(email, otp)
      if (response.status) {
        setIsAuthenticated(true)
        setIsOtpStep(false)
        setPendingEmail(null)
        // Set user with just email (minimal user object)
        const userObj: User = {
          id: '',
          email,
          name: '',
          role: 'department_head', // default or placeholder
          department: 'Human Resources'
        }
        setUser(userObj)
        localStorage.setItem('metahuman_user', JSON.stringify(userObj))
        return true
      } else {
        setIsAuthenticated(false)
        setIsOtpStep(true)
        setPendingEmail(email)
        return false
      }
    } catch (error) {
      setIsAuthenticated(false)
      setIsOtpStep(true)
      setPendingEmail(email)
      return false
    }
  }

  // For completeness, expose requestOtp (in case you want to trigger resend)
  const requestOtp = async (email: string): Promise<boolean> => {
    try {
      const response = await authApi.otpGenerator(email)
      return response.status
    } catch {
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    setIsPostLoginLoading(false)
    setIsOtpStep(false)
    setPendingEmail(null)
    localStorage.removeItem('metahuman_user')
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    
    // Super admin has all permissions
    if (user.role === 'super_admin') return true
    
    // Define role-based permissions
    const permissions: Record<string, string[]> = {
      hr_admin: ['view_all_analytics', 'manage_tokens', 'manage_users', 'view_audit_logs'],
      department_head: ['view_department_analytics', 'view_own_tokens']
    }
    
    return permissions[user.role]?.includes(permission) || false
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isPostLoginLoading,
      isOtpStep,
      pendingEmail,
      login,
      signup,
      requestOtp,
      verifyOtp,
      logout,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
