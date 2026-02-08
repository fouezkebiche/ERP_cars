// app/dashboard/hr/page.tsx (FULLY FIXED)
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/dashboard/data-table"
import { Plus, Edit2, Search, Key, UserX, Info, Loader2 } from "lucide-react"
import { useEmployees, useEmployeeStatsAndRoles, useEmployeeMutations } from "@/hooks/useEmployees"
import { employeeAPI, type CreateEmployeeData, type UpdateEmployeeData, type Employee } from "@/lib/employees"
import toast from "react-hot-toast"
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// ============================================
// MODAL COMPONENTS (OUTSIDE MAIN COMPONENT)
// ============================================

interface AddEmployeeModalProps {
  roles: any[]
  onClose: () => void
  onSuccess: () => void
}

function AddEmployeeModal({ roles, onClose, onSuccess }: AddEmployeeModalProps) {
  const [formData, setFormData] = useState<CreateEmployeeData>({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'receptionist',
    department: 'operations',
    position: '',
    salary_type: 'monthly',
    salary: 0,
    commission_rate: 0,
    hire_date: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [showRoleInfo, setShowRoleInfo] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.full_name || !formData.email || !formData.phone || !formData.password || !formData.role || !formData.hire_date) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      await employeeAPI.createEmployee(formData)
      toast.success('Employee created successfully')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Create employee error:', error)
      toast.error(error.message || 'Failed to create employee')
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = roles?.find((r: any) => r.value === formData.role)

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Add New Employee</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name *</label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@company.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Phone *</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+213 XX XXX XXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password *</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 8 characters"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                Role *
                <button
                  type="button"
                  onClick={() => setShowRoleInfo(!showRoleInfo)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Info className="w-4 h-4" />
                </button>
              </label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles && roles.length > 0 ? (
                    roles.map((role: any) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="receptionist" disabled>Loading roles...</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {selectedRole && (
                <p className="text-xs text-muted-foreground mt-1">{selectedRole.description}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Department</label>
              <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="management">Management</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="fleet">Fleet</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="customer_service">Customer Service</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Position</label>
              <Input
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="e.g., Senior Sales Manager"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Hire Date *</label>
              <Input
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              />
            </div>
          </div>

          {showRoleInfo && selectedRole && (
            <div className="p-4 bg-muted rounded-md">
              <p className="font-semibold mb-2">Permissions for {selectedRole.label}:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {selectedRole.permissions.slice(0, 10).map((perm: string) => (
                  <div key={perm} className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                    <span>{perm.replace(/_/g, ' ')}</span>
                  </div>
                ))}
                {selectedRole.permissions.length > 10 && (
                  <span className="text-muted-foreground">
                    +{selectedRole.permissions.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary/90">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Add Employee'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface EditEmployeeModalProps {
  employee: Employee
  roles: any[]
  onClose: () => void
  onSuccess: () => void
}

function EditEmployeeModal({ employee, roles, onClose, onSuccess }: EditEmployeeModalProps) {
  const [formData, setFormData] = useState<UpdateEmployeeData>({
    full_name: employee.full_name,
    phone: employee.phone,
    position: employee.position || '',
    department: employee.department || 'operations',
    status: employee.status,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      await employeeAPI.updateEmployee(employee.id, formData)
      toast.success('Employee updated successfully')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Update employee error:', error)
      toast.error(error.message || 'Failed to update employee')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Employee</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Position</label>
            <Input
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Department</label>
            <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="management">Management</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="fleet">Fleet</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="customer_service">Customer Service</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface ResetPasswordModalProps {
  employee: Employee
  onClose: () => void
  onSuccess: () => void
}

function ResetPasswordModal({ employee, onClose, onSuccess }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    try {
      setLoading(true)
      await employeeAPI.resetPassword(employee.id, newPassword)
      toast.success('Password reset successfully')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Reset password error:', error)
      toast.error(error.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Reset Password</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Reset password for: <strong>{employee.full_name}</strong>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Resetting...</> : 'Reset Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================
// MAIN HR PAGE COMPONENT
// ============================================

export default function HRPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { employees, loading, error, refetch, meta } = useEmployees({
    search: debouncedSearch || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    role: roleFilter === "all" ? undefined : roleFilter,
    page: 1,
    limit: 20,
  })

  const { stats, roles, loading: statsAndRolesLoading, error: statsError } = useEmployeeStatsAndRoles()
  const { terminate } = useEmployeeMutations()

  const handleAddEmployee = useCallback(() => {
    setShowAddModal(true)
  }, [])

  const handleEditEmployee = useCallback((employee: Employee) => {
    setSelectedEmployee(employee)
    setShowEditModal(true)
  }, [])

  const handleResetPassword = useCallback((employee: Employee) => {
    setSelectedEmployee(employee)
    setShowResetPasswordModal(true)
  }, [])

  const handleTerminateEmployee = useCallback(async (employee: Employee) => {
    if (!confirm(`Are you sure you want to terminate ${employee.full_name}? This will deactivate their account.`)) {
      return
    }

    try {
      await terminate(employee.id)
      refetch()
    } catch (error: any) {
      console.error('Terminate error:', error)
    }
  }, [terminate, refetch])

  const handleModalSuccess = useCallback(() => {
    refetch()
  }, [refetch])

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      on_leave: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      suspended: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      terminated: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  const getRoleLabel = useCallback((role: string) => {
    const roleObj = roles?.find(r => r.value === role)
    return roleObj?.label || role
  }, [roles])

  // Show loading state
  if (loading || statsAndRolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading employees...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || statsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-4">Failed to load employee data</p>
          <p className="text-sm text-muted-foreground mb-4">{error || statsError}</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['owner', 'admin', 'manager']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">HR & Employees</h1>
            <p className="text-muted-foreground">Manage your team and employee information</p>
          </div>
          <Button onClick={handleAddEmployee} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Employee Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-1">Total Employees</p>
              <p className="text-2xl font-bold">{stats.total_employees}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-1">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.by_status?.active || 0}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-1">On Leave</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.by_status?.on_leave || 0}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-1">Terminated</p>
              <p className="text-2xl font-bold text-red-600">{stats.by_status?.terminated || 0}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1 relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles?.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Employee List */}
        <div className="rounded-lg border border-border overflow-hidden">
          <DataTable
            columns={[
              { 
                key: "full_name", 
                label: "Name", 
                sortable: true,
                render: (_: any, row: Employee) => (
                  <div>
                    <p className="font-medium">{row.full_name}</p>
                    <p className="text-xs text-muted-foreground">{row.position || 'N/A'}</p>
                  </div>
                )
              },
              { 
                key: "role", 
                label: "Role", 
                sortable: true,
                render: (role: string) => getRoleLabel(role)
              },
              { 
                key: "email", 
                label: "Email",
                render: (_: any, row: Employee) => (
                  <div>
                    <p className="text-sm">{row.email}</p>
                    <p className="text-xs text-muted-foreground">{row.phone}</p>
                  </div>
                )
              },
              {
                key: "department",
                label: "Department",
                render: (dept: string | undefined) => dept ? dept.replace('_', ' ').toUpperCase() : 'N/A'
              },
              {
                key: "status",
                label: "Status",
                render: (status: string) => getStatusBadge(status),
              },
              {
                key: "id",
                label: "Actions",
                render: (_: any, row: Employee) => (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditEmployee(row)}
                      className="p-1 hover:bg-muted rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleResetPassword(row)}
                      className="p-1 hover:bg-muted rounded"
                      title="Reset Password"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    {row.role !== 'owner' && row.status !== 'terminated' && (
                      <button 
                        onClick={() => handleTerminateEmployee(row)}
                        className="p-1 hover:bg-muted rounded"
                        title="Terminate"
                      >
                        <UserX className="w-4 h-4 text-destructive" />
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
            data={employees || []}
          />
        </div>

        {/* Modals */}
        {showAddModal && roles && (
          <AddEmployeeModal
            roles={roles}
            onClose={() => setShowAddModal(false)}
            onSuccess={handleModalSuccess}
          />
        )}

        {showEditModal && selectedEmployee && roles && (
          <EditEmployeeModal
            employee={selectedEmployee}
            roles={roles}
            onClose={() => {
              setShowEditModal(false)
              setSelectedEmployee(null)
            }}
            onSuccess={handleModalSuccess}
          />
        )}

        {showResetPasswordModal && selectedEmployee && (
          <ResetPasswordModal
            employee={selectedEmployee}
            onClose={() => {
              setShowResetPasswordModal(false)
              setSelectedEmployee(null)
            }}
            onSuccess={handleModalSuccess}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}