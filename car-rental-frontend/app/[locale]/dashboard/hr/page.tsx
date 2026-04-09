// app/[locale]/dashboard/hr/page.tsx (FULLY LOCALIZED)
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
import { useTranslations } from "next-intl"

// ============================================
// MODAL COMPONENTS (OUTSIDE MAIN COMPONENT)
// ============================================

interface AddEmployeeModalProps {
  roles: any[]
  onClose: () => void
  onSuccess: () => void
}

function AddEmployeeModal({ roles, onClose, onSuccess }: AddEmployeeModalProps) {
  const t = useTranslations("hr")
  
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
      toast.error(t("fillRequiredFields"))
      return
    }

    try {
      setLoading(true)
      await employeeAPI.createEmployee(formData)
      toast.success(t("employeeCreated"))
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Create employee error:', error)
      toast.error(error.message || t("failedToCreate"))
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = roles?.find((r: any) => r.value === formData.role)

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{t("addNewEmployee")}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("fullName")} *</label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder={t("fullName")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("email")} *</label>
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
              <label className="block text-sm font-medium mb-2">{t("phone")} *</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+213 XX XXX XXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("password")} *</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("role")} *</label>
              <div className="relative">
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("role")} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => setShowRoleInfo(!showRoleInfo)}
                  className="absolute right-10 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              {showRoleInfo && selectedRole && (
                <div className="mt-2 p-2 bg-muted rounded text-xs">
                  <p className="font-medium">{selectedRole.label}</p>
                  <p className="text-muted-foreground">{selectedRole.description}</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("departmentLabel")} *</label>
              <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("departmentLabel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("position")}</label>
              <Input
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder={t("position")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("hireDate")} *</label>
              <Input
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("salaryType")}</label>
              <Select value={formData.salary_type} onValueChange={(value: any) => setFormData({ ...formData, salary_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("salaryType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="commission">Commission</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("salary")}</label>
              <Input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("commissionRate")}</label>
              <Input
                type="number"
                step="0.1"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("saveChanges")}
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
  const t = useTranslations("hr")
  
  const [formData, setFormData] = useState<UpdateEmployeeData>({
    full_name: employee.full_name,
    email: employee.email,
    phone: employee.phone,
    role: employee.role,
    department: employee.department || '',
    position: employee.position || '',
    salary_type: employee.salary_type || 'monthly',
    salary: employee.salary || 0,
    commission_rate: employee.commission_rate || 0,
    status: employee.status,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.full_name || !formData.email || !formData.phone || !formData.role) {
      toast.error(t("fillRequiredFields"))
      return
    }

    try {
      setLoading(true)
      await employeeAPI.updateEmployee(employee.id, formData)
      toast.success(t("changesSaved"))
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Update employee error:', error)
      toast.error(error.message || t("failedToUpdate"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{t("editEmployee")}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("fullName")} *</label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder={t("fullName")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("email")} *</label>
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
              <label className="block text-sm font-medium mb-2">{t("phone")} *</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+213 XX XXX XXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("role")} *</label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("role")} />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("departmentLabel")}</label>
              <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("departmentLabel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("position")}</label>
              <Input
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder={t("position")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("salaryType")}</label>
              <Select value={formData.salary_type} onValueChange={(value: any) => setFormData({ ...formData, salary_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("salaryType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="commission">Commission</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("salary")}</label>
              <Input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("commissionRate")}</label>
              <Input
                type="number"
                step="0.1"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("saveChanges")}
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
  const t = useTranslations("hr")
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields")
      return
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    try {
      setLoading(true)
      await employeeAPI.resetPassword(employee.id, password)
      toast.success(t("passwordReset"))
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Reset password error:', error)
      toast.error(error.message || t("failedToReset"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{t("resetPasswordTitle")}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t("resetPasswordDesc", { name: employee.full_name })}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t("newPassword")}</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t("confirmPassword")}</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("resetPassword")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface TerminateEmployeeModalProps {
  employee: Employee
  onClose: () => void
  onSuccess: () => void
}

function TerminateEmployeeModal({ employee, onClose, onSuccess }: TerminateEmployeeModalProps) {
  const t = useTranslations("hr")
  
  const [terminationReason, setTerminationReason] = useState('')
  const [terminationDate, setTerminationDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!terminationReason || !terminationDate) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      setLoading(true)
      await employeeAPI.terminateEmployee(employee.id, {
        termination_reason: terminationReason,
        termination_date: terminationDate,
      })
      toast.success(t("employeeTerminated"))
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Terminate employee error:', error)
      toast.error(error.message || t("failedToTerminate"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{t("terminateTitle")}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t("terminateDesc", { name: employee.full_name })}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t("terminationReason")}</label>
            <textarea
              value={terminationReason}
              onChange={(e) => setTerminationReason(e.target.value)}
              placeholder="Enter termination reason..."
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t("terminationDate")}</label>
            <Input
              type="date"
              value={terminationDate}
              onChange={(e) => setTerminationDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("confirmTermination")}
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
  const t = useTranslations("hr")
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')

  // Custom hooks
  const { employees, loading } = useEmployees({
    search: searchQuery,
    status: statusFilter === 'all' ? undefined : statusFilter,
    role: roleFilter === 'all' ? undefined : roleFilter,
  })
  const { stats, roles } = useEmployeeStatsAndRoles()
  const { updateEmployeeStatus } = useEmployeeMutations()

  const handleAddEmployee = () => {
    setShowAddModal(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowEditModal(true)
  }

  const handleResetPassword = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowResetPasswordModal(true)
  }

  const handleTerminateEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    // This would open a termination modal
    console.log('Terminate employee:', employee)
  }

  const handleModalSuccess = () => {
    // Refresh data
    window.location.reload()
  }

  const getRoleLabel = (role: string) => {
    const roleObj = roles?.find((r: any) => r.value === role)
    return roleObj?.label || role
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      on_leave: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      suspended: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
      terminated: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || ""}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['owner', 'admin', 'manager']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Button onClick={handleAddEmployee} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            {t("addEmployee")}
          </Button>
        </div>

        {/* Employee Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-1">{t("totalEmployees")}</p>
              <p className="text-2xl font-bold">{stats.total_employees}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-1">{t("active")}</p>
              <p className="text-2xl font-bold text-green-600">{stats.by_status?.active || 0}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-1">{t("onLeave")}</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.by_status?.on_leave || 0}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-1">{t("terminated")}</p>
              <p className="text-2xl font-bold text-red-600">{stats.by_status?.terminated || 0}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1 relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t("allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatuses")}</SelectItem>
                <SelectItem value="active">{t("active")}</SelectItem>
                <SelectItem value="on_leave">{t("onLeave")}</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="terminated">{t("terminated")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t("allRoles")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allRoles")}</SelectItem>
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
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("loadingEmployees")}</p>
            </div>
          ) : (
            <DataTable
              columns={[
                { 
                  key: "full_name", 
                  label: t("name"), 
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
                  label: t("role"), 
                  sortable: true,
                  render: (role: string) => getRoleLabel(role)
                },
                { 
                  key: "email", 
                  label: t("email"),
                  render: (_: any, row: Employee) => (
                    <div>
                      <p className="text-sm">{row.email}</p>
                      <p className="text-xs text-muted-foreground">{row.phone}</p>
                    </div>
                  )
                },
                {
                  key: "department",
                  label: t("department"),
                  render: (dept: string | undefined) => dept ? dept.replace('_', ' ').toUpperCase() : 'N/A'
                },
                {
                  key: "status",
                  label: t("status"),
                  render: (status: string) => getStatusBadge(status),
                },
                {
                  key: "id",
                  label: t("actions"),
                  render: (_: any, row: Employee) => (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditEmployee(row)}
                        className="p-1 hover:bg-muted rounded"
                        title={t("edit")}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleResetPassword(row)}
                        className="p-1 hover:bg-muted rounded"
                        title={t("resetPassword")}
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      {row.role !== 'owner' && row.status !== 'terminated' && (
                        <button 
                          onClick={() => handleTerminateEmployee(row)}
                          className="p-1 hover:bg-muted rounded"
                          title={t("terminate")}
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
          )}
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
