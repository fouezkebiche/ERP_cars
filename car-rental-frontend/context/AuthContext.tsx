// context/AuthContext.tsx (FIXED - Stable Auth Edition)
"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface User {
  id: string
  email: string
  full_name: string
  role: 'owner' | 'admin' | 'manager' | 'sales_agent' | 'fleet_coordinator' | 'accountant' | 'receptionist'
  company_id: string
  is_active: boolean
  last_login_at?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (data: RegisterData) => Promise<void>
  refreshToken: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasRole: (roles: string[]) => boolean
}

interface RegisterData {
  full_name: string
  email: string
  password: string
  company_id: string
  role?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)
  const router = useRouter()

  // Role-based permissions mapping
  const rolePermissions: Record<string, string[]> = {
    owner: ['*'],
    admin: [
      'view_dashboard', 'view_analytics', 'create_employees', 'update_employees',
      'delete_employees', 'view_employees', 'create_vehicles', 'update_vehicles',
      'delete_vehicles', 'view_vehicles', 'create_customers', 'update_customers',
      'delete_customers', 'view_customers', 'create_contracts', 'update_contracts',
      'cancel_contracts', 'view_contracts', 'create_payments', 'update_payments',
      'view_payments', 'manage_settings',
    ],
    manager: [
      'view_dashboard', 'view_analytics', 'view_employees', 'create_vehicles',
      'update_vehicles', 'view_vehicles', 'create_customers', 'update_customers',
      'view_customers', 'create_contracts', 'update_contracts', 'complete_contracts',
      'view_contracts', 'create_payments', 'view_payments',
    ],
    sales_agent: [
      'view_dashboard', 'create_customers', 'update_customers', 'view_customers',
      'create_contracts', 'update_contracts', 'view_contracts', 'create_payments',
      'view_payments', 'view_vehicles',
    ],
    fleet_coordinator: [
      'view_dashboard', 'create_vehicles', 'update_vehicles', 'view_vehicles',
      'add_vehicle_costs', 'view_vehicle_costs', 'view_contracts',
    ],
    accountant: [
      'view_dashboard', 'view_analytics', 'view_payments', 'create_payments',
      'update_payments', 'view_contracts', 'view_customers',
    ],
    receptionist: [
      'view_dashboard', 'view_customers', 'create_customers', 'create_contracts',
      'view_contracts', 'create_payments', 'view_payments', 'view_vehicles',
    ],
  }

  useEffect(() => {
    // ✅ Only initialize once on mount
    let mounted = true
    
    const init = async () => {
      if (!mounted) return
      await initializeAuth()
    }
    
    init()
    
    return () => {
      mounted = false
    }
  }, []) // ✅ Empty deps - only run once on mount

  const initializeAuth = async () => {
    console.log('🔄 Initializing auth...')
    
    const token = localStorage.getItem('accessToken')
    const storedUser = localStorage.getItem('user')
    
    console.log('💾 Has token:', !!token, '| Has stored user:', !!storedUser)
    
    if (token) {
      console.log('🔑 Token preview:', token.substring(0, 30) + '...')
    }
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        console.log('👤 Stored user:', parsed.email, '| Role:', parsed.role)
      } catch (e) {
        console.error('⚠️ Failed to parse stored user')
      }
    }

    // If no token, immediately set not loading
    if (!token) {
      console.log('❌ No token found, skipping auth')
      setLoading(false)
      setInitializing(false)
      return
    }

    // Restore user from localStorage immediately (optimistic)
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        console.log('✅ Restored user from localStorage:', parsedUser.email)
      } catch (e) {
        console.warn('⚠️ Invalid stored user JSON')
        clearAuth()
        setLoading(false)
        setInitializing(false)
        return
      }
    }

    // Verify token in background (non-blocking)
    try {
      console.log('🔐 Verifying token with backend...')
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      console.log('🔐 Verify response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        const freshUser = data.data.user
        
        // ✅ CRITICAL: Update BOTH state and localStorage with fresh data
        setUser(freshUser)
        localStorage.setItem('user', JSON.stringify(freshUser))
        console.log('✅ Token valid, user synced:', freshUser.email, '| Role:', freshUser.role)
      } else if (response.status === 401) {
        console.warn('⚠️ Token invalid (401), clearing auth')
        clearAuth()
        router.push('/login')
      } else {
        console.warn(`⚠️ Token verify returned ${response.status}, keeping session`)
      }
    } catch (error) {
      console.error('❌ Token verification network error:', error)
      // Keep session on network error (offline tolerance)
    } finally {
      setLoading(false)
      setInitializing(false)
    }
  }

  const clearAuth = () => {
    console.log('🧹 Clearing auth data')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      console.log('🔑 Login attempt:', email)

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log('🔑 Login response status:', response.status)

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // ✅ CRITICAL: Save tokens FIRST
      const accessToken = data.data.accessToken
      const refreshToken = data.data.refreshToken
      
      console.log('💾 Saving tokens to localStorage...')
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      
      // ✅ Verify tokens were saved
      const savedToken = localStorage.getItem('accessToken')
      console.log('✅ Token saved and verified:', !!savedToken, savedToken?.substring(0, 30) + '...')

      // ✅ CRITICAL: Save user with EXACT data from backend
      const newUser = data.data.user
      console.log('👤 Setting user state:', newUser.email, '| Role:', newUser.role, '| ID:', newUser.id)
      
      setUser(newUser)
      localStorage.setItem('user', JSON.stringify(newUser))
      
      // ✅ Verify user was saved
      const savedUser = localStorage.getItem('user')
      console.log('✅ User saved to localStorage:', !!savedUser)
      
      console.log('✅ Login successful:', newUser.full_name, '| Role:', newUser.role)
      toast.success(`Welcome back, ${newUser.full_name}!`)

      setLoading(false)
      
      console.log('🔄 Redirecting to dashboard in 100ms...')
      // ✅ Small delay to ensure state is updated
      setTimeout(() => {
        router.push('/dashboard')
      }, 100)
    } catch (error: any) {
      setLoading(false)
      console.error('❌ Login error:', error)
      toast.error(error.message || 'Login failed')
      throw error
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      const refreshTokenValue = localStorage.getItem('refreshToken')
      
      if (refreshTokenValue) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshTokenValue }),
        }).catch(err => console.warn('Logout request failed:', err))
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuth()
      setLoading(false)
      router.push('/login')
      toast.success('Logged out successfully')
    }
  }

  const register = async (data: RegisterData) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      toast.success('Registration successful! Please log in.')
      router.push('/login')
    } catch (error: any) {
      toast.error(error.message || 'Registration failed')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const refreshToken = async () => {
    try {
      setLoading(true)
      const refreshTokenValue = localStorage.getItem('refreshToken')
      
      if (!refreshTokenValue) {
        throw new Error('No refresh token')
      }

      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshTokenValue }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const newAccessToken = data.data.accessToken
      localStorage.setItem('accessToken', newAccessToken)
      
      // Re-verify user after refresh
      const meResponse = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${newAccessToken}` },
      })

      if (meResponse.ok) {
        const meData = await meResponse.json()
        const freshUser = meData.data.user
        setUser(freshUser)
        localStorage.setItem('user', JSON.stringify(freshUser))
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      clearAuth()
      router.push('/login')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    const permissions = rolePermissions[user.role] || []
    if (permissions.includes('*')) return true
    return permissions.includes(permission)
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false
    return permissions.some(perm => hasPermission(perm))
  }

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false
    return roles.includes(user.role)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: loading || initializing,
        login,
        logout,
        register,
        refreshToken,
        hasPermission,
        hasAnyPermission,
        hasRole,
      }}
    >
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