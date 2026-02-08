// components/auth/ProtectedRoute.tsx (FIXED - No More Auto-Logout)
"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: string[]
  requiredRoles?: string[]
}

export function ProtectedRoute({ 
  children, 
  requiredPermissions = [], 
  requiredRoles = [] 
}: ProtectedRouteProps) {
  const { user, loading, hasPermission, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // ✅ CRITICAL: Wait for auth to finish loading before checking
    if (loading) {
      console.log('🔄 ProtectedRoute: Still loading auth...')
      return
    }

    // ✅ Only redirect if definitely not authenticated
    if (!user) {
      console.warn('🚫 ProtectedRoute: No user found, redirecting to login')
      router.push('/login')
      return
    }

    console.log('✅ ProtectedRoute: User authenticated:', user.email, '| Role:', user.role)

    // Check role requirements
    if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
      console.warn(`🚫 ProtectedRoute: User lacks required roles [${requiredRoles.join(', ')}]`)
      router.push('/dashboard') // Redirect to dashboard instead of login
      return
    }

    // Check permission requirements
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(perm => hasPermission(perm))
      if (!hasAllPermissions) {
        console.warn(`🚫 ProtectedRoute: User lacks required permissions [${requiredPermissions.join(', ')}]`)
        router.push('/dashboard') // Redirect to dashboard instead of login
        return
      }
    }

    console.log('✅ ProtectedRoute: Access granted')
  }, [user, loading, requiredPermissions, requiredRoles, hasPermission, hasRole, router])

  // ✅ Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // ✅ Show nothing while redirecting (prevents flash of content)
  if (!user) {
    return null
  }

  // ✅ Check permissions before rendering
  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return null
  }

  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(perm => hasPermission(perm))
    if (!hasAllPermissions) {
      return null
    }
  }

  return <>{children}</>
}

// ✅ Permission Gate - conditionally render based on permissions
export function PermissionGate({ 
  children, 
  permissions = [], 
  roles = [] 
}: { 
  children: React.ReactNode
  permissions?: string[]
  roles?: string[]
}) {
  const { user, hasPermission, hasRole } = useAuth()

  if (!user) return null

  // Check roles
  if (roles.length > 0 && !hasRole(roles)) {
    return null
  }

  // Check permissions
  if (permissions.length > 0) {
    const hasAllPermissions = permissions.every(perm => hasPermission(perm))
    if (!hasAllPermissions) {
      return null
    }
  }

  return <>{children}</>
}

// ✅ Role Display - shows user's role badge
export function RoleDisplay() {
  const { user } = useAuth()

  if (!user) return null

  const roleColors: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    sales_agent: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    fleet_coordinator: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
    accountant: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    receptionist: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
  }

  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    manager: 'Manager',
    sales_agent: 'Sales Agent',
    fleet_coordinator: 'Fleet Coordinator',
    accountant: 'Accountant',
    receptionist: 'Receptionist',
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${roleColors[user.role] || roleColors.receptionist}`}>
      {roleLabels[user.role] || user.role}
    </span>
  )
}