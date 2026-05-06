// app/[locale]/dashboard/attendance/page.tsx
"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/dashboard/data-table"
import { Clock, LogOut, Calendar, Search, Users, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { attendanceAPI, type Attendance } from "@/lib/attendance"
import { employeeAPI } from "@/lib/employees"
import toast from "react-hot-toast"
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useTranslations } from "next-intl"

// ── Design tokens ────────────────────────────────────────────────────────────
const SURFACE      = 'rgba(255,255,255,0.04)'
const SURFACE2     = 'rgba(255,255,255,0.07)'
const BORDER_COLOR = 'rgba(255,255,255,0.07)'
const GREEN        = '#22C55E'
const MUTED        = 'rgba(255,255,255,0.4)'
const TEXT         = '#FFFFFF'
const FONT         = "'Plus Jakarta Sans', system-ui, sans-serif"

const spinnerStyle = `@keyframes _spin { to { transform: rotate(360deg); } }`

export default function AttendancePage() {
  const t = useTranslations("attendance")

  const [employees, setEmployees] = useState<any[]>([])
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkInLoading, setCheckInLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [employeesRes, attendanceRes] = await Promise.all([
        employeeAPI.getEmployees({ status: 'active', limit: 100 }),
        attendanceAPI.getTodayAttendance(),
      ])
      setEmployees(employeesRes.employees)
      setTodayAttendance(attendanceRes.attendance)
      setSummary(attendanceRes.summary)
    } catch (error: any) {
      toast.error(error.message || t("loadFailed"))
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async (employeeId: string) => {
    try {
      setCheckInLoading(employeeId)
      await attendanceAPI.checkIn({ employee_id: employeeId })
      toast.success(t("checkInSuccess"))
      await loadData()
    } catch (error: any) {
      toast.error(error.message || t("checkInFailed"))
    } finally {
      setCheckInLoading(null)
    }
  }

  const handleCheckOut = async (employeeId: string) => {
    try {
      setCheckInLoading(employeeId)
      await attendanceAPI.checkOut({ employee_id: employeeId })
      toast.success(t("checkOutSuccess"))
      await loadData()
    } catch (error: any) {
      toast.error(error.message || t("checkOutFailed"))
    } finally {
      setCheckInLoading(null)
    }
  }

  // ── Status badge ─────────────────────────────────────────────────────────
  const statusMap: Record<string, { bg: string; color: string }> = {
    present:  { bg: 'rgba(34,197,94,0.12)',   color: GREEN },
    late:     { bg: 'rgba(249,115,22,0.12)',  color: '#F97316' },
    absent:   { bg: 'rgba(239,68,68,0.12)',   color: '#EF4444' },
    leave:    { bg: 'rgba(59,130,246,0.12)',  color: '#60A5FA' },
    half_day: { bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B' },
  }

  const statusLabelKeys: Record<string, string> = {
    present:  t("statusLabels.present"),
    late:     t("statusLabels.late"),
    absent:   t("statusLabels.absent"),
    leave:    t("statusLabels.leave"),
    half_day: t("statusLabels.half_day"),
  }

  const getStatusBadge = (status: string) => {
    const s = statusMap[status] ?? { bg: SURFACE2, color: MUTED }
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '3px 10px', borderRadius: 99,
        fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
        background: s.bg, color: s.color,
      }}>
        {statusLabelKeys[status] ?? status.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  const formatTime = (time: string | undefined) => {
    if (!time) return <span style={{ color: MUTED }}>—</span>
    return new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const notCheckedIn = filteredEmployees.filter(emp =>
    !todayAttendance.some(att => att.employee_id === emp.id)
  )

  const checkedIn = filteredEmployees
    .filter(emp => todayAttendance.some(att => att.employee_id === emp.id))
    .map(emp => {
      const attendance = todayAttendance.find(att => att.employee_id === emp.id)
      return { ...emp, attendance }
    })

  // ── Summary card definitions ─────────────────────────────────────────────
  const summaryCards = summary ? [
    { label: t("total"),        value: summary.total_employees,  icon: <Users        style={{ width: 16, height: 16, color: MUTED }} />,       color: TEXT },
    { label: t("checkedIn"),    value: summary.checked_in,       icon: <CheckCircle2 style={{ width: 16, height: 16, color: GREEN }} />,        color: GREEN },
    { label: t("notCheckedIn"), value: summary.not_checked_in,   icon: <XCircle      style={{ width: 16, height: 16, color: '#EF4444' }} />,    color: '#EF4444' },
    { label: t("late"),         value: summary.late,             icon: <Clock        style={{ width: 16, height: 16, color: '#F97316' }} />,    color: '#F97316' },
    { label: t("onLeave"),      value: summary.on_leave,         icon: <Calendar     style={{ width: 16, height: 16, color: '#60A5FA' }} />,    color: '#60A5FA' },
  ] : []

  // ── Loading state ────────────────────────────────────────────────────────
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
              border: `4px solid ${BORDER_COLOR}`,
              borderTopColor: GREEN,
              borderRadius: '50%',
              animation: '_spin 0.8s linear infinite',
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
      <ProtectedRoute requiredRoles={['owner', 'admin', 'manager', 'receptionist']}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: FONT, color: TEXT }}>

          {/* ── Header ────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{t("title")}</h1>
              <p style={{ fontSize: 13, color: MUTED }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <button
              onClick={loadData}
              style={{
                padding: '8px 18px', borderRadius: 8,
                borderWidth: 1, borderStyle: 'solid', borderColor: BORDER_COLOR,
                background: 'transparent', color: MUTED,
                fontFamily: FONT, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.borderColor = GREEN
                el.style.color = GREEN
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.borderColor = BORDER_COLOR
                el.style.color = MUTED
              }}
            >
              {t("refresh")}
            </button>
          </div>

          {/* ── Summary cards ──────────────────────────────────────────── */}
          {summary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
              {summaryCards.map(({ label, value, icon, color }) => (
                <div key={label} style={{
                  background: SURFACE, border: `1px solid ${BORDER_COLOR}`,
                  borderRadius: 12, padding: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    {icon}
                    <p style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>{label}</p>
                  </div>
                  <p style={{ fontSize: 26, fontWeight: 700, color, margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Search ────────────────────────────────────────────────── */}
          <div style={{ position: 'relative', maxWidth: 400 }}>
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

          {/* ── Not checked in ────────────────────────────────────────── */}
          {notCheckedIn.length > 0 && (
            <div style={{
              background: SURFACE, border: `1px solid ${BORDER_COLOR}`,
              borderRadius: 12, overflow: 'hidden',
            }}>
              {/* Section header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '14px 20px',
                borderBottom: `1px solid ${BORDER_COLOR}`,
                background: 'rgba(239,68,68,0.05)',
              }}>
                <XCircle style={{ width: 16, height: 16, color: '#EF4444' }} />
                <h2 style={{ fontSize: 14, fontWeight: 600, color: TEXT, margin: 0 }}>
                  {t("notCheckedInSection")}
                  <span style={{ marginLeft: 8, fontSize: 12, color: MUTED, fontWeight: 400 }}>
                    ({notCheckedIn.length})
                  </span>
                </h2>
              </div>

              <DataTable
                columns={[
                  {
                    key: 'full_name',
                    label: t("name"),
                    render: (_: any, row: any) => (
                      <div>
                        <p style={{ fontWeight: 500, color: TEXT, fontSize: 14, margin: 0 }}>{row.full_name}</p>
                        <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{row.position || 'N/A'}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'department',
                    label: t("department"),
                    render: (dept: string) => (
                      <span style={{ fontSize: 13, color: TEXT }}>
                        {dept ? dept.replace('_', ' ').toUpperCase() : 'N/A'}
                      </span>
                    ),
                  },
                  {
                    key: 'id',
                    label: t("action"),
                    render: (_: any, row: any) => {
                      const busy = checkInLoading === row.id
                      return (
                        <button
                          onClick={() => handleCheckIn(row.id)}
                          disabled={busy}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 8, border: 'none',
                            background: busy ? BORDER_COLOR : GREEN,
                            color: busy ? MUTED : '#000',
                            fontFamily: FONT, fontSize: 13, fontWeight: 600,
                            cursor: busy ? 'not-allowed' : 'pointer',
                            boxShadow: busy ? 'none' : `0 0 10px ${GREEN}44`,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { if (!busy) (e.currentTarget as HTMLButtonElement).style.background = '#16a34a' }}
                          onMouseLeave={e => { if (!busy) (e.currentTarget as HTMLButtonElement).style.background = GREEN }}
                        >
                          {busy
                            ? <Loader2 style={{ width: 13, height: 13, animation: '_spin 0.8s linear infinite' }} />
                            : <Clock style={{ width: 13, height: 13 }} />}
                          {busy ? t("checkingIn") : t("checkIn")}
                        </button>
                      )
                    },
                  },
                ]}
                data={notCheckedIn}
              />
            </div>
          )}

          {/* ── Checked in ────────────────────────────────────────────── */}
          {checkedIn.length > 0 && (
            <div style={{
              background: SURFACE, border: `1px solid ${BORDER_COLOR}`,
              borderRadius: 12, overflow: 'hidden',
            }}>
              {/* Section header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '14px 20px',
                borderBottom: `1px solid ${BORDER_COLOR}`,
                background: 'rgba(34,197,94,0.05)',
              }}>
                <CheckCircle2 style={{ width: 16, height: 16, color: GREEN }} />
                <h2 style={{ fontSize: 14, fontWeight: 600, color: TEXT, margin: 0 }}>
                  {t("checkedInSection")}
                  <span style={{ marginLeft: 8, fontSize: 12, color: MUTED, fontWeight: 400 }}>
                    ({checkedIn.length})
                  </span>
                </h2>
              </div>

              <DataTable
                columns={[
                  {
                    key: 'full_name',
                    label: t("name"),
                    render: (_: any, row: any) => (
                      <div>
                        <p style={{ fontWeight: 500, color: TEXT, fontSize: 14, margin: 0 }}>{row.full_name}</p>
                        <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{row.position || 'N/A'}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'attendance.status',
                    label: t("status"),
                    render: (_: any, row: any) => getStatusBadge(row.attendance?.status || 'present'),
                  },
                  {
                    key: 'attendance.check_in_time',
                    label: t("checkInTime"),
                    render: (_: any, row: any) => (
                      <span style={{ fontSize: 13, color: TEXT }}>{formatTime(row.attendance?.check_in_time)}</span>
                    ),
                  },
                  {
                    key: 'attendance.check_out_time',
                    label: t("checkOutTime"),
                    render: (_: any, row: any) => (
                      <span style={{ fontSize: 13, color: TEXT }}>{formatTime(row.attendance?.check_out_time)}</span>
                    ),
                  },
                  {
                    key: 'attendance.total_hours',
                    label: t("hours"),
                    render: (_: any, row: any) => (
                      <span style={{ fontSize: 13, color: TEXT }}>
                        {row.attendance?.total_hours ? `${row.attendance.total_hours}h` : <span style={{ color: MUTED }}>—</span>}
                      </span>
                    ),
                  },
                  {
                    key: 'id',
                    label: t("action"),
                    render: (_: any, row: any) => {
                      if (row.attendance?.check_out_time) {
                        return <span style={{ fontSize: 13, color: MUTED }}>{t("completed")}</span>
                      }
                      const busy = checkInLoading === row.id
                      return (
                        <button
                          onClick={() => handleCheckOut(row.id)}
                          disabled={busy}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 8,
                            borderWidth: 1, borderStyle: 'solid',
                            borderColor: busy ? BORDER_COLOR : BORDER_COLOR,
                            background: 'transparent',
                            color: busy ? MUTED : TEXT,
                            fontFamily: FONT, fontSize: 13, fontWeight: 500,
                            cursor: busy ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s',
                            opacity: busy ? 0.5 : 1,
                          }}
                          onMouseEnter={e => {
                            if (!busy) {
                              const el = e.currentTarget as HTMLButtonElement
                              el.style.borderColor = '#F97316'
                              el.style.color = '#F97316'
                              el.style.background = 'rgba(249,115,22,0.08)'
                            }
                          }}
                          onMouseLeave={e => {
                            if (!busy) {
                              const el = e.currentTarget as HTMLButtonElement
                              el.style.borderColor = BORDER_COLOR
                              el.style.color = TEXT
                              el.style.background = 'transparent'
                            }
                          }}
                        >
                          {busy
                            ? <Loader2 style={{ width: 13, height: 13, animation: '_spin 0.8s linear infinite' }} />
                            : <LogOut style={{ width: 13, height: 13 }} />}
                          {busy ? t("checkingOut") : t("checkOut")}
                        </button>
                      )
                    },
                  },
                ]}
                data={checkedIn}
              />
            </div>
          )}

        </div>
      </ProtectedRoute>
    </>
  )
}