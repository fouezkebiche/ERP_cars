// app/[locale]/dashboard/payroll/page.tsx
"use client"

import { useEffect, useState } from "react"
import { DataTable } from "@/components/dashboard/data-table"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { payrollAPI, type Payroll, type CalculatePayrollData, type MarkAsPaidData } from "@/lib/payroll"
import { employeeAPI } from "@/lib/employees"
import { CalendarDays, CreditCard, DollarSign, Search, User, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { useTranslations } from "next-intl"

// ── Design tokens ────────────────────────────────────────────────────────────
const SURFACE      = 'rgba(255,255,255,0.04)'
const SURFACE2     = 'rgba(255,255,255,0.07)'
const BORDER_COLOR = 'rgba(255,255,255,0.07)'
const GREEN        = '#22C55E'
const MUTED        = 'rgba(255,255,255,0.4)'
const TEXT         = '#FFFFFF'
const FONT         = "'Plus Jakarta Sans', system-ui, sans-serif"

const spinnerStyle = `
  @keyframes _spin { to { transform: rotate(360deg); } }
  select option { background: #0D1117 !important; color: #FFFFFF !important; }
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

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { style, ...rest } = props
  return (
    <input
      {...rest}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 8,
        borderWidth: 1, borderStyle: 'solid', borderColor: BORDER_COLOR,
        background: SURFACE2, color: TEXT, fontFamily: FONT, fontSize: 13,
        outline: 'none', boxSizing: 'border-box', ...style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.boxShadow = `0 0 0 2px ${GREEN}22` }}
      onBlur={e => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.boxShadow = 'none' }}
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
        background: '#0D1117', color: TEXT, fontFamily: FONT, fontSize: 13,
        outline: 'none', cursor: 'pointer',
        colorScheme: 'dark',
      } as React.CSSProperties}
      onFocus={e => { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.boxShadow = `0 0 0 2px ${GREEN}22` }}
      onBlur={e => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.boxShadow = 'none' }}
    >
      {children}
    </select>
  )
}

function GreenBtn({ children, disabled, type = 'button', onClick, style }: {
  children: React.ReactNode
  disabled?: boolean
  type?: 'button' | 'submit'
  onClick?: () => void
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
      onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = disabled ? BORDER_COLOR : GREEN }}
    >
      {children}
    </button>
  )
}

function GhostBtn({ children, disabled, type = 'button', onClick }: {
  children: React.ReactNode
  disabled?: boolean
  type?: 'button' | 'submit'
  onClick?: () => void
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '10px 0', borderRadius: 8,
        borderWidth: 1, borderStyle: 'solid', borderColor: BORDER_COLOR,
        background: 'transparent', color: MUTED,
        fontFamily: FONT, fontSize: 14, fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}

function ModalShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#0D1117', border: `1px solid ${BORDER_COLOR}`,
        borderRadius: 14, padding: 28, width: '100%', maxWidth: 448,
        fontFamily: FONT,
      }}>
        {children}
      </div>
    </div>
  )
}

// ── Status badge ─────────────────────────────────────────────────────────────
const statusStyles: Record<string, { bg: string; color: string }> = {
  pending:   { bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B' },
  approved:  { bg: 'rgba(59,130,246,0.12)',  color: '#60A5FA' },
  paid:      { bg: 'rgba(34,197,94,0.12)',   color: GREEN },
  cancelled: { bg: 'rgba(239,68,68,0.12)',   color: '#EF4444' },
}

function StatusBadge({ status }: { status: string }) {
  const s = statusStyles[status] ?? { bg: SURFACE2, color: MUTED }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 99,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
      background: s.bg, color: s.color,
    }}>
      {status.toUpperCase()}
    </span>
  )
}

// ── Interfaces ───────────────────────────────────────────────────────────────
interface EmployeeOption {
  id: string
  full_name: string
  position?: string
  department?: string
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function PayrollPage() {
  const t = useTranslations("payroll")

  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [stats, setStats] = useState<any | null>(null)
  const [byStatus, setByStatus] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [search, setSearch] = useState("")

  const [calculateModalOpen, setCalculateModalOpen] = useState(false)
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null)
  const [calculateData, setCalculateData] = useState<CalculatePayrollData>({
    employee_id: "", pay_period_start: "", pay_period_end: "",
  })
  const [payData, setPayData] = useState<MarkAsPaidData>({
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "bank_transfer",
    payment_reference: "",
  })
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => { loadInitialData() }, [])
  useEffect(() => { loadPayroll() }, [month])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [employeesRes] = await Promise.all([
        employeeAPI.getEmployees({ status: "active", limit: 200 }),
      ])
      setEmployees(employeesRes.employees || [])
      await Promise.all([loadPayroll(), loadStats()])
    } catch (error: any) {
      toast.error(error.message || t("failedToLoad"))
    } finally {
      setLoading(false)
    }
  }

  const loadPayroll = async () => {
    try {
      const res = await payrollAPI.getPayroll({ month, limit: 100 })
      setPayrolls(res.payroll || [])
    } catch (error: any) {
      toast.error(error.message || t("failedToFetch"))
    }
  }

  const loadStats = async () => {
    try {
      const res = await payrollAPI.getStats(month)
      setStats(res.stats)
      setByStatus(res.by_status || [])
    } catch (error: any) {
      toast.error(error.message || t("failedToFetchStats"))
    }
  }

  const openCalculateModal = () => {
    setCalculateData({
      employee_id: "",
      pay_period_start: `${month}-01`,
      pay_period_end: `${month}-28`,
    })
    setCalculateModalOpen(true)
  }

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!calculateData.employee_id || !calculateData.pay_period_start || !calculateData.pay_period_end) {
      toast.error(t("pleaseFillAllFields")); return
    }
    try {
      setActionLoading(true)
      await payrollAPI.calculatePayroll(calculateData)
      toast.success(t("payrollCalculated"))
      setCalculateModalOpen(false)
      await Promise.all([loadPayroll(), loadStats()])
    } catch (error: any) {
      toast.error(error.message || t("failedToCalculate"))
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async (payroll: Payroll) => {
    try {
      setActionLoading(true)
      await payrollAPI.approvePayroll(payroll.id)
      toast.success(t("payrollApproved"))
      await Promise.all([loadPayroll(), loadStats()])
    } catch (error: any) {
      toast.error(error.message || t("failedToApprove"))
    } finally {
      setActionLoading(false)
    }
  }

  const openPayModal = (payroll: Payroll) => {
    setSelectedPayroll(payroll)
    setPayData({
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "bank_transfer",
      payment_reference: "",
    })
    setPayModalOpen(true)
  }

  const handleMarkAsPaid = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPayroll) return
    try {
      setActionLoading(true)
      await payrollAPI.markAsPaid(selectedPayroll.id, payData)
      toast.success(t("payrollMarkedPaid"))
      setPayModalOpen(false)
      setSelectedPayroll(null)
      await Promise.all([loadPayroll(), loadStats()])
    } catch (error: any) {
      toast.error(error.message || t("failedToMarkPaid"))
    } finally {
      setActionLoading(false)
    }
  }

  const filteredPayrolls = payrolls.filter(p => {
    if (!search) return true
    return (p.employee?.full_name?.toLowerCase() || "").includes(search.toLowerCase())
  })

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <style>{spinnerStyle}</style>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', fontFamily: FONT,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48,
              border: `4px solid ${BORDER_COLOR}`, borderTopColor: GREEN,
              borderRadius: '50%', animation: '_spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{ color: MUTED, fontSize: 14 }}>{t("loading")}</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{spinnerStyle}</style>
      <ProtectedRoute requiredRoles={["owner", "admin", "accountant"]}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: FONT, color: TEXT }}>

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{t("title")}</h1>
              <p style={{ fontSize: 13, color: MUTED }}>{t("subtitle")}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* Month picker */}
              <input
                type="month"
                value={month}
                onChange={e => setMonth(e.target.value)}
                style={{
                  padding: '8px 12px', borderRadius: 8, width: 160,
                  borderWidth: 1, borderStyle: 'solid', borderColor: BORDER_COLOR,
                  background: SURFACE2, color: TEXT, fontFamily: FONT, fontSize: 13,
                  outline: 'none', cursor: 'pointer',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = GREEN }}
                onBlur={e => { e.currentTarget.style.borderColor = BORDER_COLOR }}
              />
              {/* Calculate button */}
              <button
                onClick={openCalculateModal}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '9px 18px', borderRadius: 8, border: 'none',
                  background: GREEN, color: '#000',
                  fontFamily: FONT, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', boxShadow: `0 0 12px ${GREEN}44`,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#16a34a' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = GREEN }}
              >
                <CalendarDays style={{ width: 15, height: 15 }} />
                {t("calculatePayroll")}
              </button>
            </div>
          </div>

          {/* ── Summary cards ───────────────────────────────────────────── */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              {/* Total payrolls */}
              <div style={{ background: SURFACE, border: `1px solid ${BORDER_COLOR}`, borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <User style={{ width: 15, height: 15, color: MUTED }} />
                  <p style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>{t("totalPayrolls")}</p>
                </div>
                <p style={{ fontSize: 26, fontWeight: 700, color: TEXT, margin: 0 }}>{stats.total_payrolls || 0}</p>
              </div>

              {/* Total gross */}
              <div style={{ background: SURFACE, border: `1px solid ${BORDER_COLOR}`, borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <DollarSign style={{ width: 15, height: 15, color: MUTED }} />
                  <p style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>{t("totalGross")}</p>
                </div>
                <p style={{ fontSize: 22, fontWeight: 700, color: TEXT, margin: 0 }}>
                  {Number(stats.total_gross || 0).toLocaleString()} DZD
                </p>
              </div>

              {/* Total net */}
              <div style={{ background: SURFACE, border: `1px solid ${BORDER_COLOR}`, borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <CreditCard style={{ width: 15, height: 15, color: MUTED }} />
                  <p style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>{t("totalNet")}</p>
                </div>
                <p style={{ fontSize: 22, fontWeight: 700, color: GREEN, margin: 0 }}>
                  {Number(stats.total_net || 0).toLocaleString()} DZD
                </p>
              </div>

              {/* By status */}
              <div style={{ background: SURFACE, border: `1px solid ${BORDER_COLOR}`, borderRadius: 12, padding: 20 }}>
                <p style={{ fontSize: 12, color: MUTED, fontWeight: 500, marginBottom: 10 }}>{t("byStatus")}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {byStatus.map(s => {
                    const sc = statusStyles[s.payment_status] ?? { color: MUTED }
                    return (
                      <div key={s.payment_status} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: sc.color, textTransform: 'capitalize', fontWeight: 500 }}>
                          {s.payment_status}
                        </span>
                        <span style={{ color: MUTED }}>
                          {Number(s.amount || 0).toLocaleString()} DZD ({s.count})
                        </span>
                      </div>
                    )
                  })}
                  {byStatus.length === 0 && (
                    <p style={{ fontSize: 12, color: MUTED }}>{t("noPayrolls")}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Search ──────────────────────────────────────────────────── */}
          <div style={{ position: 'relative', maxWidth: 400 }}>
            <Search style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              width: 15, height: 15, color: MUTED, pointerEvents: 'none',
            }} />
            <input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={e => setSearch(e.target.value)}
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

          {/* ── Payroll table ────────────────────────────────────────────── */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER_COLOR}`, borderRadius: 12, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 20px', borderBottom: `1px solid ${BORDER_COLOR}`,
            }}>
              <CreditCard style={{ width: 15, height: 15, color: MUTED }} />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: TEXT, margin: 0 }}>
                {t("payrollRecords")}
                <span style={{ marginLeft: 8, fontSize: 12, color: MUTED, fontWeight: 400 }}>
                  ({filteredPayrolls.length})
                </span>
              </h2>
            </div>

            <DataTable
              columns={[
                {
                  key: 'employee',
                  label: t("employee"),
                  render: (_: any, row: Payroll) => (
                    <div>
                      <p style={{ fontWeight: 500, color: TEXT, fontSize: 14, margin: 0 }}>
                        {row.employee?.full_name || 'Unknown'}
                      </p>
                      <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
                        {row.employee?.position || ''}
                        {row.employee?.department ? ` • ${row.employee.department}` : ''}
                      </p>
                    </div>
                  ),
                },
                {
                  key: 'period',
                  label: t("period"),
                  render: (_: any, row: Payroll) => (
                    <span style={{ fontSize: 13, color: MUTED }}>
                      {row.pay_period_start} → {row.pay_period_end}
                    </span>
                  ),
                },
                {
                  key: 'net_salary',
                  label: t("netSalary"),
                  render: (_: any, row: Payroll) => (
                    <span style={{ fontSize: 14, fontWeight: 600, color: GREEN }}>
                      {Number(row.net_salary).toLocaleString()} DZD
                    </span>
                  ),
                },
                {
                  key: 'payment_status',
                  label: t("status"),
                  render: (status: Payroll["payment_status"]) => <StatusBadge status={status} />,
                },
                {
                  key: 'actions',
                  label: t("actions"),
                  render: (_: any, row: Payroll) => (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {row.payment_status === 'pending' && (
                        <button
                          onClick={() => handleApprove(row)}
                          disabled={actionLoading}
                          style={{
                            padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                            borderWidth: 1, borderStyle: 'solid', borderColor: BORDER_COLOR,
                            background: 'transparent', color: MUTED,
                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                            fontFamily: FONT, transition: 'all 0.15s',
                            opacity: actionLoading ? 0.5 : 1,
                          }}
                          onMouseEnter={e => {
                            if (!actionLoading) {
                              const el = e.currentTarget as HTMLButtonElement
                              el.style.borderColor = '#60A5FA'
                              el.style.color = '#60A5FA'
                              el.style.background = 'rgba(59,130,246,0.08)'
                            }
                          }}
                          onMouseLeave={e => {
                            if (!actionLoading) {
                              const el = e.currentTarget as HTMLButtonElement
                              el.style.borderColor = BORDER_COLOR
                              el.style.color = MUTED
                              el.style.background = 'transparent'
                            }
                          }}
                        >
                          {t("approve")}
                        </button>
                      )}
                      {row.payment_status === 'approved' && (
                        <button
                          onClick={() => openPayModal(row)}
                          disabled={actionLoading}
                          style={{
                            padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                            border: 'none', background: actionLoading ? BORDER_COLOR : GREEN,
                            color: actionLoading ? MUTED : '#000',
                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                            fontFamily: FONT, transition: 'background 0.15s',
                            boxShadow: actionLoading ? 'none' : `0 0 8px ${GREEN}44`,
                          }}
                          onMouseEnter={e => { if (!actionLoading) (e.currentTarget as HTMLButtonElement).style.background = '#16a34a' }}
                          onMouseLeave={e => { if (!actionLoading) (e.currentTarget as HTMLButtonElement).style.background = GREEN }}
                        >
                          {t("markAsPaid")}
                        </button>
                      )}
                    </div>
                  ),
                },
              ]}
              data={filteredPayrolls}
            />
          </div>

          {/* ── Calculate payroll modal ──────────────────────────────────── */}
          {calculateModalOpen && (
            <ModalShell>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 20 }}>
                {t("calculatePayrollTitle")}
              </h2>
              <form onSubmit={handleCalculate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <FieldLabel>{t("selectEmployee")} *</FieldLabel>
                  <StyledSelect
                    value={calculateData.employee_id}
                    onChange={v => setCalculateData({ ...calculateData, employee_id: v })}
                  >
                    <option value="" disabled>{t("selectEmployee")}</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name}{emp.position ? ` • ${emp.position}` : ''}
                      </option>
                    ))}
                  </StyledSelect>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <FieldLabel>{t("startDate")} *</FieldLabel>
                    <StyledInput
                      type="date"
                      value={calculateData.pay_period_start}
                      onChange={e => setCalculateData({ ...calculateData, pay_period_start: e.target.value })}
                    />
                  </div>
                  <div>
                    <FieldLabel>{t("endDate")} *</FieldLabel>
                    <StyledInput
                      type="date"
                      value={calculateData.pay_period_end}
                      onChange={e => setCalculateData({ ...calculateData, pay_period_end: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                  <GhostBtn type="button" onClick={() => setCalculateModalOpen(false)} disabled={actionLoading}>
                    {t("cancel")}
                  </GhostBtn>
                  <GreenBtn type="submit" disabled={actionLoading}>
                    {actionLoading && <Loader2 style={{ width: 14, height: 14, animation: '_spin 0.8s linear infinite' }} />}
                    {actionLoading ? t("calculating") : t("calculate")}
                  </GreenBtn>
                </div>
              </form>
            </ModalShell>
          )}

          {/* ── Mark as paid modal ───────────────────────────────────────── */}
          {payModalOpen && selectedPayroll && (
            <ModalShell>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 6 }}>
                {t("markAsPaidTitle")}
              </h2>
              <p style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>
                {selectedPayroll.employee?.full_name} •{' '}
                {selectedPayroll.pay_period_start} → {selectedPayroll.pay_period_end}
              </p>

              <form onSubmit={handleMarkAsPaid} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <FieldLabel>{t("paymentDate")} *</FieldLabel>
                  <StyledInput
                    type="date"
                    value={payData.payment_date}
                    onChange={e => setPayData({ ...payData, payment_date: e.target.value })}
                  />
                </div>

                <div>
                  <FieldLabel>{t("paymentMethod")} *</FieldLabel>
                  <StyledSelect
                    value={payData.payment_method}
                    onChange={v => setPayData({ ...payData, payment_method: v as any })}
                  >
                    <option value="bank_transfer">{t("bankTransfer")}</option>
                    <option value="cash">{t("cash")}</option>
                    <option value="check">{t("check")}</option>
                  </StyledSelect>
                </div>

                <div>
                  <FieldLabel>{t("reference")}</FieldLabel>
                  <StyledInput
                    value={payData.payment_reference ?? ''}
                    onChange={e => setPayData({ ...payData, payment_reference: e.target.value })}
                    placeholder={t("referencePlaceholder")}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                  <GhostBtn
                    type="button"
                    onClick={() => { setPayModalOpen(false); setSelectedPayroll(null) }}
                    disabled={actionLoading}
                  >
                    {t("cancel")}
                  </GhostBtn>
                  <GreenBtn type="submit" disabled={actionLoading}>
                    {actionLoading && <Loader2 style={{ width: 14, height: 14, animation: '_spin 0.8s linear infinite' }} />}
                    {actionLoading ? t("saving") : t("confirmPayment")}
                  </GreenBtn>
                </div>
              </form>
            </ModalShell>
          )}

        </div>
      </ProtectedRoute>
    </>
  )
}