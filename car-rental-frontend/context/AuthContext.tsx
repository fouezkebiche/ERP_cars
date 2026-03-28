// context/AuthContext.tsx
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

// ─── Single source of truth for redirect logic ────────────────────────────────
// "owner" = YOU, the platform superadmin → /admin
// everyone else (admin, manager, staff…) = client company user → /dashboard
function getRedirectPath(role: string): string {
  return role === 'owner' ? '/admin' : '/dashboard'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)
  const router = useRouter()

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
    let mounted = true
    const init = async () => {
      if (!mounted) return
      await initializeAuth()
    }
    init()
    return () => { mounted = false }
  }, [])

  const initializeAuth = async () => {
    const token = localStorage.getItem('accessToken')
    const storedUser = localStorage.getItem('user')

    if (!token) {
      setLoading(false)
      setInitializing(false)
      return
    }

    // Restore from localStorage immediately (optimistic)
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        clearAuth()
        setLoading(false)
        setInitializing(false)
        return
      }
    }

    // Verify token in background
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        const freshUser = data.data.user
        setUser(freshUser)
        localStorage.setItem('user', JSON.stringify(freshUser))
      } else if (response.status === 401) {
        clearAuth()
        router.push('/login')
      }
    } catch {
      // Keep session on network error
    } finally {
      setLoading(false)
      setInitializing(false)
    }
  }

  const clearAuth = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      localStorage.setItem('accessToken', data.data.accessToken)
      localStorage.setItem('refreshToken', data.data.refreshToken)

      const newUser = data.data.user
      setUser(newUser)
      localStorage.setItem('user', JSON.stringify(newUser))

      toast.success(`Welcome back, ${newUser.full_name}!`)
      setLoading(false)

      // ✅ Only "owner" goes to /admin — every other role goes to /dashboard
      setTimeout(() => {
        router.push(getRedirectPath(newUser.role))
      }, 100)

    } catch (error: any) {
      setLoading(false)
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

      if (!refreshTokenValue) throw new Error('No refresh token')

      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshTokenValue }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error('Token refresh failed')

      const newAccessToken = data.data.accessToken
      localStorage.setItem('accessToken', newAccessToken)

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
    <AuthContext.Provider value={{
      user,
      loading: loading || initializing,
      login,
      logout,
      register,
      refreshToken,
      hasPermission,
      hasAnyPermission,
      hasRole,
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