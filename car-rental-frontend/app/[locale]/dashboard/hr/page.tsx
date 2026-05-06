// app/[locale]/dashboard/hr/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { DataTable } from "@/components/dashboard/data-table"
import { Plus, Edit2, Search, Key, UserX, Info, Loader2 } from "lucide-react"
import { useEmployees, useEmployeeStatsAndRoles, useEmployeeMutations } from "@/hooks/useEmployees"
import { employeeAPI, type CreateEmployeeData, type UpdateEmployeeData, type Employee } from "@/lib/employees"
import toast from "react-hot-toast"
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useTranslations } from "next-intl"

// ── Design tokens ────────────────────────────────────────────────────────────
const BG           = '#080B10'
const SURFACE      = 'rgba(255,255,255,0.04)'
const SURFACE2     = 'rgba(255,255,255,0.07)'
const BORDER_COLOR = 'rgba(255,255,255,0.07)'
const GREEN        = '#22C55E'
const MUTED        = 'rgba(255,255,255,0.4)'
const TEXT         = '#FFFFFF'
const FONT         = "'Plus Jakarta Sans', system-ui, sans-serif"

const spinnerStyle = `
  @keyframes _spin { to { transform: rotate(360deg); } }
`

// ── Shared primitives ────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: 'block', fontSize: 12, fontWeight: 500, color: MUTED,
      marginBottom: 6, fontFamily: FONT,
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>
      {children}
    </label>
  )
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean; hasSuccess?: boolean }) {
  const { hasError, hasSuccess, style, ...rest } = props
  const borderColor = hasError ? '#EF4444' : hasSuccess ? GREEN : BORDER_COLOR
  return (
    <input
      {...rest}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 8,
        borderWidth: 1, borderStyle: 'solid', borderColor,
        background: SURFACE2, color: TEXT, fontFamily: FONT, fontSize: 13,
        outline: 'none', boxSizing: 'border-box', ...style,
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = hasError ? '#EF4444' : GREEN
        e.currentTarget.style.boxShadow = `0 0 0 2px ${hasError ? '#EF444422' : GREEN + '22'}`
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = borderColor
        e.currentTarget.style.boxShadow = 'none'
      }}
    />
  )
}

function StyledSelect({ value, onChange, children }: {
  value: string | undefined
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 8,
        borderWidth: 1, borderStyle: 'solid', borderColor: BORDER_COLOR,
        background: SURFACE2, color: TEXT, fontFamily: FONT, fontSize: 13,
        outline: 'none', cursor: 'pointer', appearance: 'auto',
      }}
    >
      {children}
    </select>
  )
}

function StyledTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 8,
        borderWidth: 1, borderStyle: 'solid', borderColor: BORDER_COLOR,
        background: SURFACE2, color: TEXT, fontFamily: FONT, fontSize: 13,
        outline: 'none', resize: 'vertical', boxSizing: 'border-box',
        ...(props.style || {}),
      }}
      onFocus={e => { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.boxShadow = `0 0 0 2px ${GREEN}22` }}
      onBlur={e => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.boxShadow = 'none' }}
    />
  )
}

function GreenBtn({ children, onClick, disabled, type = 'button', style }: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  style?: React.CSSProperties
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '10px 0', borderRadius: 8, border: 'none',
        background: disabled ? BORDER_COLOR : GREEN,
        color: disabled ? MUTED : '#000',
        fontFamily: FONT, fontSize: 14, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : `0 0 12px ${GREEN}44`,
        transition: 'all 0.15s', ...style,
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = '#16a34a' }}
      onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = GREEN }}
    >
      {children}
    </button>
  )
}

function GhostBtn({ children, onClick, disabled, type = 'button', danger }: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  danger?: boolean
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '10px 0', borderRadius: 8,
        borderWidth: 1, borderStyle: 'solid',
        borderColor: danger ? '#EF4444' : BORDER_COLOR,
        background: danger ? 'rgba(239,68,68,0.08)' : 'transparent',
        color: danger ? '#EF4444' : MUTED,
        fontFamily: FONT, fontSize: 14, fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}

// ── Modal backdrop + shell ───────────────────────────────────────────────────
function ModalShell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, overflowY: 'auto',
      backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        background: '#0D1117',
        border: `1px solid ${BORDER_COLOR}`,
        borderRadius: 14, padding: 28,
        width: '100%', maxWidth: wide ? 672 : 448,
        maxHeight: '90vh', overflowY: 'auto',
        fontFamily: FONT,
      }}>
        {children}
      </div>
    </div>
  )
}

function ModalTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 20 }}>{children}</h2>
}

function FormGrid({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
      {children}
    </div>
  )
}

function FormRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
}

// ============================================================================
// ADD EMPLOYEE MODAL
// ============================================================================

interface AddEmployeeModalProps {
  roles: any[]
  onClose: () => void
  onSuccess: () => void
}

function AddEmployeeModal({ roles, onClose, onSuccess }: AddEmployeeModalProps) {
  const t = useTranslations("hr")

  const [formData, setFormData] = useState<CreateEmployeeData>({
    full_name: '', email: '', phone: '', password: '',
    role: 'receptionist', department: 'operations', position: '',
    salary_type: 'monthly', salary: 0, commission_rate: 0,
    hire_date: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [showRoleInfo, setShowRoleInfo] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.full_name?.trim()) { toast.error("Full name is required"); return }
    if (!formData.email?.trim()) { toast.error("Email is required"); return }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) { toast.error("Please enter a valid email address"); return }
    if (!formData.phone?.trim()) { toast.error("Phone number is required"); return }
    if (!formData.password?.trim()) { toast.error("Password is required"); return }
    if (formData.password.length < 8) { toast.error("Password must be at least 8 characters long"); return }
    if (!formData.role) { toast.error("Please select a role"); return }
    if (!formData.hire_date) { toast.error("Hire date is required"); return }

    try {
      setLoading(true)
      await employeeAPI.createEmployee(formData)
      toast.success(t("employeeCreated"))
      onSuccess(); onClose()
    } catch (error: any) {
      if (error.message?.includes('email')) toast.error("Please enter a valid email address")
      else if (error.message?.includes('Password')) toast.error("Password must be at least 8 characters long")
      else if (error.message?.includes('already in use')) toast.error("This email is already registered")
      else if (error.message?.includes('403')) toast.error("You don't have permission to create employees")
      else toast.error(error.message || t("failedToCreate"))
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = roles?.find((r: any) => r.value === formData.role)

  return (
    <ModalShell wide>
      <ModalTitle>{t("addNewEmployee")}</ModalTitle>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <FormGrid>
          <FormRow>
            <FieldLabel>{t("fullName")} *</FieldLabel>
            <StyledInput value={formData.full_name ?? ''} onChange={e => setFormData({ ...formData, full_name: e.target.value })} placeholder={t("fullName")} />
          </FormRow>
          <FormRow>
            <FieldLabel>{t("email")} *</FieldLabel>
            <StyledInput type="email" value={formData.email ?? ''} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@company.com" />
          </FormRow>
        </FormGrid>

        <FormGrid>
          <FormRow>
            <FieldLabel>{t("phone")} *</FieldLabel>
            <StyledInput value={formData.phone ?? ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+213 XX XXX XXXX" />
          </FormRow>
          <FormRow>
            <FieldLabel>{t("password")} *</FieldLabel>
            <StyledInput type="password" value={formData.password ?? ''} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" />
          </FormRow>
        </FormGrid>

        <FormGrid>
          <FormRow>
            <FieldLabel>{t("role")} *</FieldLabel>
            <div style={{ position: 'relative' }}>
              <StyledSelect value={formData.role ?? ''} onChange={v => setFormData({ ...formData, role: v })}>
                {roles?.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </StyledSelect>
              <button
                type="button"
                onClick={() => setShowRoleInfo(!showRoleInfo)}
                style={{
                  position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', cursor: 'pointer', color: MUTED, padding: 0,
                }}
              >
                <Info style={{ width: 15, height: 15 }} />
              </button>
            </div>
            {showRoleInfo && selectedRole && (
              <div style={{ marginTop: 6, padding: '8px 12px', background: SURFACE2, borderRadius: 8, border: `1px solid ${BORDER_COLOR}` }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{selectedRole.label}</p>
                <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{selectedRole.description}</p>
              </div>
            )}
          </FormRow>
          <FormRow>
            <FieldLabel>{t("departmentLabel")} *</FieldLabel>
            <StyledSelect value={formData.department ?? ''} onChange={v => setFormData({ ...formData, department: v })}>
              <option value="operations">Operations</option>
              <option value="management">Management</option>
              <option value="sales">Sales</option>
              <option value="fleet">Fleet</option>
              <option value="finance">Finance</option>
              <option value="customer_service">Customer Service</option>
            </StyledSelect>
          </FormRow>
        </FormGrid>

        <FormGrid>
          <FormRow>
            <FieldLabel>{t("position")}</FieldLabel>
            <StyledInput value={formData.position ?? ''} onChange={e => setFormData({ ...formData, position: e.target.value })} placeholder={t("position")} />
          </FormRow>
          <FormRow>
            <FieldLabel>{t("hireDate")} *</FieldLabel>
            <StyledInput type="date" value={formData.hire_date ?? ''} onChange={e => setFormData({ ...formData, hire_date: e.target.value })} />
          </FormRow>
        </FormGrid>

        <FormGrid cols={3}>
          <FormRow>
            <FieldLabel>{t("salaryType")}</FieldLabel>
            <StyledSelect value={formData.salary_type ?? ''} onChange={v => setFormData({ ...formData, salary_type: v as any })}>
              <option value="monthly">Monthly</option>
              <option value="hourly">Hourly</option>
              <option value="commission">Commission</option>
            </StyledSelect>
          </FormRow>
          <FormRow>
            <FieldLabel>{t("salary")}</FieldLabel>
            <StyledInput type="number" value={formData.salary ?? 0} onChange={e => setFormData({ ...formData, salary: Number(e.target.value) })} placeholder="0" />
          </FormRow>
          <FormRow>
            <FieldLabel>{t("commissionRate")}</FieldLabel>
            <StyledInput type="number" step="0.1" value={formData.commission_rate ?? 0} onChange={e => setFormData({ ...formData, commission_rate: Number(e.target.value) })} placeholder="0" />
          </FormRow>
        </FormGrid>

        <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
          <GhostBtn type="button" onClick={onClose} disabled={loading}>Cancel</GhostBtn>
          <GreenBtn type="submit" disabled={loading}>
            {loading && <Loader2 style={{ width: 15, height: 15, animation: '_spin 0.8s linear infinite' }} />}
            {t("saveChanges")}
          </GreenBtn>
        </div>
      </form>
    </ModalShell>
  )
}

// ============================================================================
// EDIT EMPLOYEE MODAL
// ============================================================================

interface EditEmployeeModalProps {
  employee: Employee
  roles: any[]
  onClose: () => void
  onSuccess: () => void
}

function EditEmployeeModal({ employee, roles, onClose, onSuccess }: EditEmployeeModalProps) {
  const t = useTranslations("hr")

  const [formData, setFormData] = useState<UpdateEmployeeData>({
    full_name: employee.full_name, phone: employee.phone, role: employee.role,
    department: employee.department || '', position: employee.position || '',
    salary_type: employee.salary_type || 'monthly',
    salary: employee.salary || 0, commission_rate: employee.commission_rate || 0,
    status: employee.status,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.full_name || !formData.phone || !formData.role) {
      toast.error(t("fillRequiredFields")); return
    }
    try {
      setLoading(true)
      await employeeAPI.updateEmployee(employee.id, formData)
      toast.success(t("changesSaved"))
      onSuccess(); onClose()
    } catch (error: any) {
      toast.error(error.message || t("failedToUpdate"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalShell wide>
      <ModalTitle>{t("editEmployee")}</ModalTitle>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <FormRow>
          <FieldLabel>{t("fullName")} *</FieldLabel>
          <StyledInput value={formData.full_name ?? ''} onChange={e => setFormData({ ...formData, full_name: e.target.value })} placeholder={t("fullName")} />
        </FormRow>

        <FormGrid>
          <FormRow>
            <FieldLabel>{t("phone")} *</FieldLabel>
            <StyledInput value={formData.phone ?? ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+213 XX XXX XXXX" />
          </FormRow>
          <FormRow>
            <FieldLabel>{t("role")} *</FieldLabel>
            <StyledSelect value={formData.role ?? ''} onChange={v => setFormData({ ...formData, role: v })}>
              {roles?.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </StyledSelect>
          </FormRow>
        </FormGrid>

        <FormGrid>
          <FormRow>
            <FieldLabel>{t("departmentLabel")}</FieldLabel>
            <StyledSelect value={formData.department ?? ''} onChange={v => setFormData({ ...formData, department: v })}>
              <option value="operations">Operations</option>
              <option value="management">Management</option>
              <option value="sales">Sales</option>
              <option value="fleet">Fleet</option>
              <option value="finance">Finance</option>
              <option value="customer_service">Customer Service</option>
            </StyledSelect>
          </FormRow>
          <FormRow>
            <FieldLabel>{t("position")}</FieldLabel>
            <StyledInput value={formData.position ?? ''} onChange={e => setFormData({ ...formData, position: e.target.value })} placeholder={t("position")} />
          </FormRow>
        </FormGrid>

        <FormGrid cols={3}>
          <FormRow>
            <FieldLabel>{t("salaryType")}</FieldLabel>
            <StyledSelect value={formData.salary_type ?? ''} onChange={v => setFormData({ ...formData, salary_type: v as any })}>
              <option value="monthly">Monthly</option>
              <option value="hourly">Hourly</option>
              <option value="commission">Commission</option>
            </StyledSelect>
          </FormRow>
          <FormRow>
            <FieldLabel>{t("salary")}</FieldLabel>
            <StyledInput type="number" value={formData.salary ?? 0} onChange={e => setFormData({ ...formData, salary: Number(e.target.value) })} placeholder="0" />
          </FormRow>
          <FormRow>
            <FieldLabel>{t("commissionRate")}</FieldLabel>
            <StyledInput type="number" step="0.1" value={formData.commission_rate ?? 0} onChange={e => setFormData({ ...formData, commission_rate: Number(e.target.value) })} placeholder="0" />
          </FormRow>
        </FormGrid>

        <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
          <GhostBtn type="button" onClick={onClose} disabled={loading}>Cancel</GhostBtn>
          <GreenBtn type="submit" disabled={loading}>
            {loading && <Loader2 style={{ width: 15, height: 15, animation: '_spin 0.8s linear infinite' }} />}
            {t("saveChanges")}
          </GreenBtn>
        </div>
      </form>
    </ModalShell>
  )
}

// ============================================================================
// RESET PASSWORD MODAL
// ============================================================================

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

  const getPasswordStrength = (pwd: string) => {
    if (!pwd)         return { strength: 0, color: BORDER_COLOR, text: '' }
    if (pwd.length < 8)  return { strength: 1, color: '#EF4444', text: 'Too short (min 8 chars)' }
    if (pwd.length < 12) return { strength: 2, color: '#F59E0B', text: 'Fair' }
    if (pwd.length < 16) return { strength: 3, color: '#3B82F6', text: 'Good' }
    return { strength: 4, color: GREEN, text: 'Strong' }
  }

  const ps = getPasswordStrength(password)
  const passwordsMatch = confirmPassword && password === confirmPassword
  const passwordsMismatch = confirmPassword && password !== confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !confirmPassword) { toast.error("Please fill in all fields"); return }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return }
    if (password.length < 8) { toast.error("Password must be at least 8 characters long"); return }
    try {
      setLoading(true)
      await employeeAPI.resetPassword(employee.id, password)
      toast.success(t("passwordReset"))
      onSuccess(); onClose()
    } catch (error: any) {
      if (error.message?.includes('Validation failed')) toast.error("Password must be at least 8 characters long")
      else if (error.message?.includes('403')) toast.error("You don't have permission to reset passwords")
      else toast.error(error.message || t("failedToReset"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalShell>
      <ModalTitle>{t("resetPasswordTitle")}</ModalTitle>
      <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, marginTop: -12 }}>
        {t("resetPasswordDesc", { name: employee.full_name })}
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <FormRow>
          <FieldLabel>{t("newPassword")}</FieldLabel>
          <StyledInput
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            hasError={password.length > 0 && password.length < 8}
          />
          {password && (
            <div style={{ marginTop: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: MUTED }}>Password strength:</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: ps.color }}>{ps.text}</span>
              </div>
              <div style={{ width: '100%', height: 4, background: BORDER_COLOR, borderRadius: 99 }}>
                <div style={{
                  height: '100%', borderRadius: 99, background: ps.color,
                  width: `${(ps.strength / 4) * 100}%`, transition: 'width 0.3s, background 0.3s',
                }} />
              </div>
              {password.length < 8 && (
                <p style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>Password must be at least 8 characters</p>
              )}
            </div>
          )}
        </FormRow>

        <FormRow>
          <FieldLabel>{t("confirmPassword")}</FieldLabel>
          <StyledInput
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            hasError={!!passwordsMismatch}
            hasSuccess={!!passwordsMatch}
          />
          {confirmPassword && (
            <p style={{ fontSize: 11, marginTop: 4, color: passwordsMatch ? GREEN : '#EF4444' }}>
              {passwordsMatch ? 'Passwords match ✓' : 'Passwords do not match'}
            </p>
          )}
        </FormRow>

        <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
          <GhostBtn type="button" onClick={onClose} disabled={loading}>Cancel</GhostBtn>
          <GreenBtn type="submit" disabled={loading}>
            {loading && <Loader2 style={{ width: 15, height: 15, animation: '_spin 0.8s linear infinite' }} />}
            {t("resetPassword")}
          </GreenBtn>
        </div>
      </form>
    </ModalShell>
  )
}

// ============================================================================
// TERMINATE EMPLOYEE MODAL
// ============================================================================

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
    if (!terminationReason || !terminationDate) { toast.error("Please fill in all fields"); return }
    try {
      setLoading(true)
      // @ts-ignore
      await employeeAPI.terminateEmployee(employee.id, {
        termination_reason: terminationReason,
        termination_date: terminationDate,
      })
      toast.success(t("employeeTerminated"))
      onSuccess(); onClose()
    } catch (error: any) {
      toast.error(error.message || t("failedToTerminate"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalShell>
      <ModalTitle>{t("terminateTitle")}</ModalTitle>
      <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, marginTop: -12 }}>
        {t("terminateDesc", { name: employee.full_name })}
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <FormRow>
          <FieldLabel>{t("terminationReason")}</FieldLabel>
          <StyledTextarea
            value={terminationReason}
            onChange={e => setTerminationReason(e.target.value)}
            placeholder="Enter termination reason..."
            rows={3}
          />
        </FormRow>

        <FormRow>
          <FieldLabel>{t("terminationDate")}</FieldLabel>
          <StyledInput type="date" value={terminationDate} onChange={e => setTerminationDate(e.target.value)} />
        </FormRow>

        <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
          <GhostBtn type="button" onClick={onClose} disabled={loading}>Cancel</GhostBtn>
          <GhostBtn type="submit" danger disabled={loading}>
            {loading && <Loader2 style={{ width: 15, height: 15, animation: '_spin 0.8s linear infinite' }} />}
            {t("confirmTermination")}
          </GhostBtn>
        </div>
      </form>
    </ModalShell>
  )
}

// ============================================================================
// MAIN HR PAGE
// ============================================================================

export default function HRPage() {
  const t = useTranslations("hr")

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [showTerminateModal, setShowTerminateModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')

  const { employees, loading } = useEmployees({
    search: searchQuery,
    status: statusFilter === 'all' ? undefined : statusFilter,
    role: roleFilter === 'all' ? undefined : roleFilter,
  })
  const { stats, roles } = useEmployeeStatsAndRoles()
  // @ts-ignore
  const { updateEmployeeStatus } = useEmployeeMutations()

  const handleEditEmployee = (employee: Employee) => { setSelectedEmployee(employee); setShowEditModal(true) }
  const handleResetPassword = (employee: Employee) => { setSelectedEmployee(employee); setShowResetPasswordModal(true) }
  const handleTerminateEmployee = (employee: Employee) => { setSelectedEmployee(employee); setShowTerminateModal(true) }
  const handleModalSuccess = () => { window.location.reload() }

  const getRoleLabel = (role: string) => roles?.find((r: any) => r.value === role)?.label || role

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      active:     { bg: 'rgba(34,197,94,0.12)',   color: GREEN },
      on_leave:   { bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B' },
      suspended:  { bg: 'rgba(249,115,22,0.12)',  color: '#F97316' },
      terminated: { bg: 'rgba(239,68,68,0.12)',   color: '#EF4444' },
    }
    const s = map[status] ?? { bg: SURFACE2, color: MUTED }
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
        background: s.bg, color: s.color, letterSpacing: '0.04em',
      }}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  // Stat card data
  const statCards = stats ? [
    { label: t("totalEmployees"), value: stats.total_employees,              color: TEXT },
    { label: t("active"),         value: stats.by_status?.active     || 0,  color: GREEN },
    { label: t("onLeave"),        value: stats.by_status?.on_leave   || 0,  color: '#F59E0B' },
    { label: t("terminated"),     value: stats.by_status?.terminated || 0,  color: '#EF4444' },
  ] : []

  return (
    <>
      <style>{spinnerStyle}</style>
      <ProtectedRoute requiredRoles={['owner', 'admin', 'manager']}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: FONT, color: TEXT }}>

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{t("title")}</h1>
              <p style={{ fontSize: 14, color: MUTED }}>{t("subtitle")}</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 8, border: 'none',
                background: GREEN, color: '#000', fontFamily: FONT, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', boxShadow: `0 0 14px ${GREEN}44`,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#16a34a' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = GREEN }}
            >
              <Plus style={{ width: 16, height: 16 }} />
              {t("addEmployee")}
            </button>
          </div>

          {/* ── Stats ───────────────────────────────────────────────────── */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
              {statCards.map(({ label, value, color }) => (
                <div key={label} style={{
                  background: SURFACE, border: `1px solid ${BORDER_COLOR}`,
                  borderRadius: 12, padding: 20,
                }}>
                  <p style={{ fontSize: 12, color: MUTED, marginBottom: 6, fontWeight: 500 }}>{label}</p>
                  <p style={{ fontSize: 26, fontWeight: 700, color, margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Filters ─────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                width: 15, height: 15, color: MUTED, pointerEvents: 'none',
              }} />
              <input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8,
                  borderWidth: 1, borderStyle: 'solid', borderColor: BORDER_COLOR,
                  background: SURFACE2, color: TEXT, fontFamily: FONT, fontSize: 13,
                  outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.boxShadow = `0 0 0 2px ${GREEN}22` }}
                onBlur={e => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '9px 12px', borderRadius: 8, minWidth: 160,
                borderWidth: 1, borderStyle: 'solid', borderColor: BORDER_COLOR,
                background: SURFACE2, color: TEXT, fontFamily: FONT, fontSize: 13,
                outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="all">{t("allStatuses")}</option>
              <option value="active">{t("active")}</option>
              <option value="on_leave">{t("onLeave")}</option>
              <option value="suspended">Suspended</option>
              <option value="terminated">{t("terminated")}</option>
            </select>

            {/* Role filter */}
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              style={{
                padding: '9px 12px', borderRadius: 8, minWidth: 160,
                borderWidth: 1, borderStyle: 'solid', borderColor: BORDER_COLOR,
                background: SURFACE2, color: TEXT, fontFamily: FONT, fontSize: 13,
                outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="all">{t("allRoles")}</option>
              {roles?.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* ── Employee table ───────────────────────────────────────────── */}
          <div style={{
            background: SURFACE, border: `1px solid ${BORDER_COLOR}`,
            borderRadius: 12, overflow: 'hidden',
          }}>
            {loading ? (
              <div style={{ padding: 48, textAlign: 'center', color: MUTED, fontSize: 14 }}>
                {t("loadingEmployees")}
              </div>
            ) : (
              <DataTable
                columns={[
                  {
                    key: 'full_name', label: t("name"), sortable: true,
                    render: (_: any, row: Employee) => (
                      <div>
                        <p style={{ fontWeight: 500, color: TEXT, fontSize: 14, margin: 0 }}>{row.full_name}</p>
                        <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{row.position || 'N/A'}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'role', label: t("role"), sortable: true,
                    render: (role: string) => (
                      <span style={{ fontSize: 13, color: TEXT }}>{getRoleLabel(role)}</span>
                    ),
                  },
                  {
                    key: 'email', label: t("email"),
                    render: (_: any, row: Employee) => (
                      <div>
                        <p style={{ fontSize: 13, color: TEXT, margin: 0 }}>{row.email}</p>
                        <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{row.phone}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'department', label: t("department"),
                    render: (dept: string | undefined) => (
                      <span style={{ fontSize: 13, color: TEXT }}>
                        {dept ? dept.replace('_', ' ').toUpperCase() : 'N/A'}
                      </span>
                    ),
                  },
                  {
                    key: 'status', label: t("status"),
                    render: (status: string) => getStatusBadge(status),
                  },
                  {
                    key: 'id', label: t("actions"),
                    render: (_: any, row: Employee) => (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {/* Edit */}
                        <button
                          onClick={() => handleEditEmployee(row)}
                          title={t("edit")}
                          style={{
                            width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: 6, border: 'none', background: 'transparent', color: MUTED,
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = SURFACE2; el.style.color = TEXT }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'transparent'; el.style.color = MUTED }}
                        >
                          <Edit2 style={{ width: 15, height: 15 }} />
                        </button>
                        {/* Reset password */}
                        <button
                          onClick={() => handleResetPassword(row)}
                          title={t("resetPassword")}
                          style={{
                            width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: 6, border: 'none', background: 'transparent', color: MUTED,
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = `${GREEN}18`; el.style.color = GREEN }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'transparent'; el.style.color = MUTED }}
                        >
                          <Key style={{ width: 15, height: 15 }} />
                        </button>
                        {/* Terminate */}
                        {row.role !== 'owner' && row.status !== 'terminated' && (
                          <button
                            onClick={() => handleTerminateEmployee(row)}
                            title={t("terminate")}
                            style={{
                              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              borderRadius: 6, border: 'none', background: 'transparent', color: MUTED,
                              cursor: 'pointer', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'rgba(239,68,68,0.12)'; el.style.color = '#EF4444' }}
                            onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'transparent'; el.style.color = MUTED }}
                          >
                            <UserX style={{ width: 15, height: 15 }} />
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

          {/* ── Modals ──────────────────────────────────────────────────── */}
          {showAddModal && roles && (
            <AddEmployeeModal roles={roles} onClose={() => setShowAddModal(false)} onSuccess={handleModalSuccess} />
          )}
          {showEditModal && selectedEmployee && roles && (
            <EditEmployeeModal
              employee={selectedEmployee} roles={roles}
              onClose={() => { setShowEditModal(false); setSelectedEmployee(null) }}
              onSuccess={handleModalSuccess}
            />
          )}
          {showResetPasswordModal && selectedEmployee && (
            <ResetPasswordModal
              employee={selectedEmployee}
              onClose={() => { setShowResetPasswordModal(false); setSelectedEmployee(null) }}
              onSuccess={handleModalSuccess}
            />
          )}
          {showTerminateModal && selectedEmployee && (
            <TerminateEmployeeModal
              employee={selectedEmployee}
              onClose={() => { setShowTerminateModal(false); setSelectedEmployee(null) }}
              onSuccess={handleModalSuccess}
            />
          )}
        </div>
      </ProtectedRoute>
    </>
  )
}