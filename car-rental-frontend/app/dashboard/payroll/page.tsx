"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/dashboard/data-table"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { payrollAPI, type Payroll, type CalculatePayrollData, type MarkAsPaidData } from "@/lib/payroll"
import { employeeAPI } from "@/lib/employees"
import { CalendarDays, CreditCard, DollarSign, Search, User } from "lucide-react"
import toast from "react-hot-toast"

interface EmployeeOption {
  id: string
  full_name: string
  position?: string
  department?: string
}

export default function PayrollPage() {
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
    employee_id: "",
    pay_period_start: "",
    pay_period_end: "",
  })
  const [payData, setPayData] = useState<MarkAsPaidData>({
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "bank_transfer",
    payment_reference: "",
  })
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadPayroll()
  }, [month])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [employeesRes] = await Promise.all([
        employeeAPI.getEmployees({ status: "active", limit: 200 }),
      ])
      setEmployees(employeesRes.employees || [])
      await Promise.all([loadPayroll(), loadStats()])
    } catch (error: any) {
      console.error("Load payroll initial data error:", error)
      toast.error(error.message || "Failed to load payroll data")
    } finally {
      setLoading(false)
    }
  }

  const loadPayroll = async () => {
    try {
      const res = await payrollAPI.getPayroll({ month, limit: 100 })
      setPayrolls(res.payroll || [])
    } catch (error: any) {
      console.error("Get payroll error:", error)
      toast.error(error.message || "Failed to fetch payroll records")
    }
  }

  const loadStats = async () => {
    try {
      const res = await payrollAPI.getStats(month)
      setStats(res.stats)
      setByStatus(res.by_status || [])
    } catch (error: any) {
      console.error("Get payroll stats error:", error)
      toast.error(error.message || "Failed to fetch payroll stats")
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
      toast.error("Please fill all fields")
      return
    }
    try {
      setActionLoading(true)
      await payrollAPI.calculatePayroll(calculateData)
      toast.success("Payroll calculated successfully")
      setCalculateModalOpen(false)
      await Promise.all([loadPayroll(), loadStats()])
    } catch (error: any) {
      console.error("Calculate payroll error:", error)
      toast.error(error.message || "Failed to calculate payroll")
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async (payroll: Payroll) => {
    try {
      setActionLoading(true)
      await payrollAPI.approvePayroll(payroll.id)
      toast.success("Payroll approved")
      await Promise.all([loadPayroll(), loadStats()])
    } catch (error: any) {
      console.error("Approve payroll error:", error)
      toast.error(error.message || "Failed to approve payroll")
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
      toast.success("Payroll marked as paid")
      setPayModalOpen(false)
      setSelectedPayroll(null)
      await Promise.all([loadPayroll(), loadStats()])
    } catch (error: any) {
      console.error("Mark as paid error:", error)
      toast.error(error.message || "Failed to mark payroll as paid")
    } finally {
      setActionLoading(false)
    }
  }

  const filteredPayrolls = payrolls.filter((p) => {
    if (!search) return true
    const name = p.employee?.full_name?.toLowerCase() || ""
    return name.includes(search.toLowerCase())
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading payroll...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={["owner", "admin", "accountant"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Payroll</h1>
            <p className="text-muted-foreground">
              Manage salary calculations, approvals, and payments for your employees.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-44"
            />
            <Button onClick={openCalculateModal} className="bg-primary hover:bg-primary/90">
              <CalendarDays className="w-4 h-4 mr-2" />
              Calculate Payroll
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Total Payrolls</p>
              </div>
              <p className="text-2xl font-bold">{stats.total_payrolls || 0}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Total Gross</p>
              </div>
              <p className="text-2xl font-bold">
                {Number(stats.total_gross || 0).toLocaleString()} DZD
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Total Net</p>
              </div>
              <p className="text-2xl font-bold">
                {Number(stats.total_net || 0).toLocaleString()} DZD
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-2">By Status</p>
              <div className="space-y-1 text-xs">
                {byStatus.map((s) => (
                  <div key={s.payment_status} className="flex justify-between">
                    <span className="capitalize">{s.payment_status}</span>
                    <span className="font-medium">
                      {Number(s.amount || 0).toLocaleString()} DZD ({s.count})
                    </span>
                  </div>
                ))}
                {byStatus.length === 0 && (
                  <p className="text-muted-foreground">No payrolls yet for this month.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by employee name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Payroll table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="bg-muted px-4 py-3 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payroll Records ({filteredPayrolls.length})
            </h2>
          </div>
          <DataTable
            columns={[
              {
                key: "employee",
                label: "Employee",
                render: (_: any, row: Payroll) => (
                  <div>
                    <p className="font-medium">{row.employee?.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.employee?.position || ""} {row.employee?.department && `• ${row.employee.department}`}
                    </p>
                  </div>
                ),
              },
              {
                key: "period",
                label: "Period",
                render: (_: any, row: Payroll) => (
                  <div className="text-sm">
                    {row.pay_period_start} → {row.pay_period_end}
                  </div>
                ),
              },
              {
                key: "net_salary",
                label: "Net Salary",
                render: (value: any, row: Payroll) => (
                  <span className="font-semibold">
                    {Number(row.net_salary).toLocaleString()} DZD
                  </span>
                ),
              },
              {
                key: "payment_status",
                label: "Status",
                render: (status: Payroll["payment_status"]) => {
                  const styles: Record<string, string> = {
                    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
                    approved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
                    paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
                    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
                  }
                  return (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || ""}`}>
                      {status.toUpperCase()}
                    </span>
                  )
                },
              },
              {
                key: "actions",
                label: "Actions",
                render: (_: any, row: Payroll) => (
                  <div className="flex gap-2">
                    {row.payment_status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading}
                        onClick={() => handleApprove(row)}
                      >
                        Approve
                      </Button>
                    )}
                    {row.payment_status === "approved" && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        disabled={actionLoading}
                        onClick={() => openPayModal(row)}
                      >
                        Mark as Paid
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            data={filteredPayrolls}
          />
        </div>

        {/* Calculate payroll modal */}
        {calculateModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Calculate Payroll</h2>
              <form onSubmit={handleCalculate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Employee *</label>
                  <Select
                    value={calculateData.employee_id}
                    onValueChange={(value) => setCalculateData({ ...calculateData, employee_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name}
                          {emp.position ? ` • ${emp.position}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date *</label>
                    <Input
                      type="date"
                      value={calculateData.pay_period_start}
                      onChange={(e) =>
                        setCalculateData({ ...calculateData, pay_period_start: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Date *</label>
                    <Input
                      type="date"
                      value={calculateData.pay_period_end}
                      onChange={(e) =>
                        setCalculateData({ ...calculateData, pay_period_end: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setCalculateModalOpen(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={actionLoading}>
                    {actionLoading ? "Calculating..." : "Calculate"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mark as paid modal */}
        {payModalOpen && selectedPayroll && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-2">Mark as Paid</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {selectedPayroll.employee?.full_name} •{" "}
                {selectedPayroll.pay_period_start} → {selectedPayroll.pay_period_end}
              </p>
              <form onSubmit={handleMarkAsPaid} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Date *</label>
                  <Input
                    type="date"
                    value={payData.payment_date}
                    onChange={(e) => setPayData({ ...payData, payment_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Method *</label>
                  <Select
                    value={payData.payment_method}
                    onValueChange={(value: any) =>
                      setPayData({ ...payData, payment_method: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Reference (optional)</label>
                  <Input
                    value={payData.payment_reference || ""}
                    onChange={(e) =>
                      setPayData({ ...payData, payment_reference: e.target.value })
                    }
                    placeholder="Transaction reference, check number, etc."
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setPayModalOpen(false)
                      setSelectedPayroll(null)
                    }}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={actionLoading}>
                    {actionLoading ? "Saving..." : "Confirm Payment"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

