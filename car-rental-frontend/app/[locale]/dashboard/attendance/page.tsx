// app/[locale]/dashboard/attendance/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/dashboard/data-table"
import { Clock, LogOut, Calendar, Search, Users, CheckCircle2, XCircle } from "lucide-react"
import { attendanceAPI, type Attendance } from "@/lib/attendance"
import { employeeAPI } from "@/lib/employees"
import toast from "react-hot-toast"
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useTranslations } from "next-intl"

export default function AttendancePage() {
  const t = useTranslations("attendance")

  const [employees, setEmployees] = useState<any[]>([])
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkInLoading, setCheckInLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadData()
  }, [])

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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      present: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      late: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      absent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
      leave: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      half_day: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    }

    const labelKey = status as keyof typeof statusLabelKeys
    const statusLabelKeys = {
      present: t("statusLabels.present"),
      late: t("statusLabels.late"),
      absent: t("statusLabels.absent"),
      leave: t("statusLabels.leave"),
      half_day: t("statusLabels.half_day"),
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabelKeys[labelKey] ?? status.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  const formatTime = (time: string | undefined) => {
    if (!time) return '-'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['owner', 'admin', 'manager', 'receptionist']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Button onClick={loadData} variant="outline">
            {t("refresh")}
          </Button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t("total")}</p>
              </div>
              <p className="text-2xl font-bold">{summary.total_employees}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <p className="text-sm text-muted-foreground">{t("checkedIn")}</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{summary.checked_in}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-muted-foreground">{t("notCheckedIn")}</p>
              </div>
              <p className="text-2xl font-bold text-red-600">{summary.not_checked_in}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <p className="text-sm text-muted-foreground">{t("late")}</p>
              </div>
              <p className="text-2xl font-bold text-orange-600">{summary.late}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-muted-foreground">{t("onLeave")}</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">{summary.on_leave}</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Not Checked In */}
        {notCheckedIn.length > 0 && (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="bg-muted px-4 py-3 border-b border-border">
              <h2 className="font-semibold flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                {t("notCheckedInSection")} ({notCheckedIn.length})
              </h2>
            </div>
            <DataTable
              columns={[
                {
                  key: "full_name",
                  label: t("name"),
                  render: (_: any, row: any) => (
                    <div>
                      <p className="font-medium">{row.full_name}</p>
                      <p className="text-xs text-muted-foreground">{row.position || 'N/A'}</p>
                    </div>
                  )
                },
                {
                  key: "department",
                  label: t("department"),
                  render: (dept: string) => dept ? dept.replace('_', ' ').toUpperCase() : 'N/A'
                },
                {
                  key: "id",
                  label: t("action"),
                  render: (_: any, row: any) => (
                    <Button
                      onClick={() => handleCheckIn(row.id)}
                      disabled={checkInLoading === row.id}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      {checkInLoading === row.id ? t("checkingIn") : t("checkIn")}
                    </Button>
                  ),
                },
              ]}
              data={notCheckedIn}
            />
          </div>
        )}

        {/* Checked In */}
        {checkedIn.length > 0 && (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="bg-muted px-4 py-3 border-b border-border">
              <h2 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                {t("checkedInSection")} ({checkedIn.length})
              </h2>
            </div>
            <DataTable
              columns={[
                {
                  key: "full_name",
                  label: t("name"),
                  render: (_: any, row: any) => (
                    <div>
                      <p className="font-medium">{row.full_name}</p>
                      <p className="text-xs text-muted-foreground">{row.position || 'N/A'}</p>
                    </div>
                  )
                },
                {
                  key: "attendance.status",
                  label: t("status"),
                  render: (_: any, row: any) => getStatusBadge(row.attendance?.status || 'present'),
                },
                {
                  key: "attendance.check_in_time",
                  label: t("checkInTime"),
                  render: (_: any, row: any) => formatTime(row.attendance?.check_in_time),
                },
                {
                  key: "attendance.check_out_time",
                  label: t("checkOutTime"),
                  render: (_: any, row: any) => formatTime(row.attendance?.check_out_time),
                },
                {
                  key: "attendance.total_hours",
                  label: t("hours"),
                  render: (_: any, row: any) => row.attendance?.total_hours ? `${row.attendance.total_hours}h` : '-',
                },
                {
                  key: "id",
                  label: t("action"),
                  render: (_: any, row: any) => (
                    row.attendance?.check_out_time ? (
                      <span className="text-sm text-muted-foreground">{t("completed")}</span>
                    ) : (
                      <Button
                        onClick={() => handleCheckOut(row.id)}
                        disabled={checkInLoading === row.id}
                        size="sm"
                        variant="outline"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {checkInLoading === row.id ? t("checkingOut") : t("checkOut")}
                      </Button>
                    )
                  ),
                },
              ]}
              data={checkedIn}
            />
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}