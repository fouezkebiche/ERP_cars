"use client"
import { useState, useEffect } from "react"
import { BarChart3, Car, CreditCard, Users, TrendingUp, AlertCircle, Calendar, DollarSign, Bell, X, Link as LinkIcon } from "lucide-react"
import { KPICard } from "@/components/dashboard/kpi-card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { DataTable } from "@/components/dashboard/data-table"
import { useDashboard } from "@/hooks/useAnalytics"
import { useNotifications } from "@/hooks/useNotifications"
import toast from "react-hot-toast"
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Link from "next/link"
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
export default function DashboardPage() {
  const [companyName, setCompanyName] = useState("Your Company")
  const [token, setToken] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  )
  // State for showing dismissed notifications
  const [showDismissed, setShowDismissed] = useState(false);
 
  const [dateRange] = useState({
    period: 'month' as 'today' | 'week' | 'month' | 'quarter' | 'year',
  })
  // Fetch dashboard KPIs
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard
  } = useDashboard({ period: dateRange.period })
  // FIXED: Hook now fetches 'high' (catches warnings + critical; backend ENUM matches both)
  const {
    data: notificationsData,
    loading: notificationsLoading,
    error: notificationsError,
    dismissNotification,
    restoreNotification,
    refetch: refetchNotifications, // Expose refetch from hook
  } = useNotifications({ priority: 'high', limit: 5, unread: true, showDismissed })  // CHANGED: 'high' from 'critical'
  const highNotifications = notificationsData?.notifications || []  // RENAMED: For clarity
  // Fetch company profile
  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/api/company/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) {
            toast.error("Session expired. Please log in again.")
            localStorage.removeItem('accessToken')
            setToken(null)
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
            return null
          }
          throw new Error(`HTTP ${res.status}`)
        }
        return res.json()
      })
      .then(responseData => {
        if (responseData) {
          const { data } = responseData
          const { company } = data || {}
          if (company) {
            setCompanyName(company.name || "Your Company")
          }
        }
      })
      .catch((error) => {
        console.error("Fetch company error:", error)
        toast.error("Failed to load company data")
      })
    }
  }, [token])
  // handleDismiss now uses the updated dismissNotification
  const handleDismiss = (id: string) => {
    dismissNotification(id)
  }
  // New handler for restore
  const handleRestore = (id: string) => {
    restoreNotification(id)
  }
  // FIXED: Helper now passes notif.type for vehicle_limit pro render
  const renderNotificationDetails = (data: any, notifType?: string) => {  // NEW: Pass notif.type
    if (!data || typeof data !== 'object') return null;
    // KM-specific rendering for better UX
    if (data.alert_type?.startsWith('km_limit') || notifType?.startsWith('km_limit')) {  // FIXED: Or notifType
      return (
        <div className="text-xs bg-muted/50 p-3 rounded mb-2 space-y-2">
          <strong className="block font-medium text-xs uppercase tracking-wide mb-1">Key Details</strong>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {data.vehicle && (
              <div className="flex items-center gap-1">
                <Car className="w-3 h-3 opacity-70" />
                <span className="font-medium">Vehicle:</span> {data.vehicle}
              </div>
            )}
            {data.km_driven !== undefined && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 opacity-70" />
                <span className="font-medium">Driven:</span> {data.km_driven} km
              </div>
            )}
            {data.km_allowed !== undefined && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 opacity-70" />
                <span className="font-medium">Allowed:</span> {data.km_allowed} km
              </div>
            )}
            {data.km_overage > 0 && (
              <div className="flex items-center gap-1 text-destructive">
                <AlertCircle className="w-3 h-3" />
                <span className="font-medium">Overage:</span> +{data.km_overage} km
              </div>
            )}
            {data.estimated_overage !== undefined && (
              <div className="flex items-center gap-1 text-destructive">
                <CreditCard className="w-3 h-3" />
                <span className="font-medium">Charge:</span> {data.estimated_overage} DZD
              </div>
            )}
            {data.contract_id && (
              <div className="col-span-2">
                <Link
                  href={`/dashboard/contracts/${data.contract_id}`}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <LinkIcon className="w-3 h-3" />
                  View Contract Details
                </Link>
              </div>
            )}
          </div>
          {data.km_overage > 0 && (
            <div className="mt-2 p-2 bg-destructive/10 rounded text-xs border border-destructive/20">
              <strong>Action Required:</strong> Update invoice with overage fees and contact customer.
            </div>
          )}
        </div>
      );
    }
    // NEW: Vehicle limit pro render (grid like KM)
    if (notifType?.startsWith('vehicle_limit')) {
      return (
        <div className="text-xs bg-muted/50 p-3 rounded mb-2 space-y-2">
          <strong className="block font-medium text-xs uppercase tracking-wide mb-1">Fleet Status</strong>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Car className="w-3 h-3 opacity-70" />
              <span className="font-medium">Current:</span> {data.current}/{data.max}
            </div>
            <div className="flex items-center gap-1 text-destructive">
              <AlertCircle className="w-3 h-3" />
              <span className="font-medium">Remaining:</span> {data.remaining}
            </div>
            <div className="col-span-2">
              <Link 
                href="/dashboard/billing" 
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <LinkIcon className="w-3 h-3" />
                Upgrade to Enterprise (500 slots)
              </Link>
            </div>
          </div>
          {data.remaining <= 10 && (
            <div className="mt-2 p-2 bg-destructive/10 rounded text-xs border border-destructive/20">
              <strong>Urgent:</strong> Upgrade soon to avoid fleet lockout.
            </div>
          )}
        </div>
      );
    }
    // Fallback for other types: Clean bullet list (no raw JSON)
    return (
      <div className="text-xs bg-muted/50 p-3 rounded mb-2 space-y-1">
        <strong>Details:</strong>
        <ul className="list-disc list-inside text-xs mt-1 space-y-0.5">
          {Object.entries(data).map(([key, value]) => (
            <li key={key} className="capitalize">
              <span className="font-medium">{key.replace(/_/g, ' ').toLowerCase()}:</span>{' '}
              {typeof value === 'object' 
                ? Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(', ') || 'N/A'  // FIXED: Flatten objects
                : String(value) || 'N/A'
              }
            </li>
          ))}
        </ul>
      </div>
    );
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }
  if (dashboardLoading || notificationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }
  if (dashboardError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Dashboard</h2>
          <p className="text-muted-foreground mb-4">{dashboardError}</p>
          <button
            onClick={() => refetchDashboard()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }
  const revenue = dashboardData?.revenue || { total: 0, average_transaction: 0, payment_count: 0 }
  const fleet = dashboardData?.fleet || {
    total_vehicles: 0,
    active_rentals: 0,
    available_vehicles: 0,
    maintenance_vehicles: 0,
    average_utilization: 0
  }
  const customers = dashboardData?.customers || {
    total: 0,
    new: 0,
    repeat: 0,
    retention_rate: 0
  }
  const topVehicles = dashboardData?.top_vehicles || []
  return (
    <ProtectedRoute requiredPermissions={['view_dashboard']}>
      <div className="relative min-h-screen">
      
        {/* Fixed Red Notification Bell (High/Critical Only) - Respects showDismissed */}
        {highNotifications.length > 0 && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg border border-destructive/50 animate-in slide-in-from-top-2 duration-300">
            <Bell className="w-5 h-5" />
            <span className="font-semibold text-sm max-w-64">
              🚨 {highNotifications[0].title}
            </span>
            <button
              onClick={() => handleDismiss(highNotifications[0].id)}
              className="ml-2 p-1 hover:bg-destructive/20 rounded"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {companyName}! Here's your business overview for the past month.
            </p>
          </div>
          {/* Primary KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Total Revenue"
              value={formatCurrency(revenue.total)}
              suffix="DZD"
              icon={<DollarSign className="w-6 h-6" />}
            />
            <KPICard
              label="Active Rentals"
              value={fleet.active_rentals}
              icon={<Car className="w-6 h-6" />}
            />
            <KPICard
              label="Available Vehicles"
              value={fleet.available_vehicles}
              icon={<Car className="w-6 h-6" />}
            />
            <KPICard
              label="Total Customers"
              value={customers.total}
              icon={<Users className="w-6 h-6" />}
            />
          </div>
          {/* Secondary KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Avg Transaction"
              value={formatCurrency(revenue.average_transaction)}
              suffix="DZD"
              icon={<CreditCard className="w-6 h-6" />}
            />
            <KPICard
              label="Fleet Utilization"
              value={`${fleet.average_utilization.toFixed(1)}%`}
              icon={<TrendingUp className="w-6 h-6" />}
            />
            <KPICard
              label="Maintenance Vehicles"
              value={fleet.maintenance_vehicles}
              icon={<AlertCircle className="w-6 h-6" />}
            />
            <KPICard
              label="Retention Rate"
              value={`${customers.retention_rate.toFixed(1)}%`}
              icon={<Users className="w-6 h-6" />}
            />
          </div>
          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <QuickActions
              actions={[
                { label: "New Rental", href: "/dashboard/contracts/new" },
                { label: "Add Vehicle", href: "/dashboard/vehicles/new" },
                { label: "Register Customer", href: "/dashboard/customers/new" },
                { label: "View Analytics", href: "/dashboard/analytics" },
              ]}
            />
          </div>
          {/* Fleet Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Car className="w-5 h-5" />
                Fleet Status
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Vehicles</span>
                  <span className="font-semibold text-lg">{fleet.total_vehicles}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full flex">
                    <div
                      className="bg-green-500"
                      style={{
                        width: `${(fleet.available_vehicles / fleet.total_vehicles || 0) * 100}%`
                      }}
                      title={`Available: ${fleet.available_vehicles}`}
                    />
                    <div
                      className="bg-blue-500"
                      style={{
                        width: `${(fleet.active_rentals / fleet.total_vehicles || 0) * 100}%`
                      }}
                      title={`Rented: ${fleet.active_rentals}`}
                    />
                    <div
                      className="bg-amber-500"
                      style={{
                        width: `${(fleet.maintenance_vehicles / fleet.total_vehicles || 0) * 100}%`
                      }}
                      title={`Maintenance: ${fleet.maintenance_vehicles}`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Available ({fleet.available_vehicles})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>Rented ({fleet.active_rentals})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span>Maintenance ({fleet.maintenance_vehicles})</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Customer Insights
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">New Customers</span>
                  <span className="font-semibold text-lg text-green-600">{customers.new}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Repeat Customers</span>
                  <span className="font-semibold text-lg text-blue-600">{customers.repeat}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Retention Rate</span>
                  <span className="font-semibold text-lg text-accent">
                    {customers.retention_rate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Top Performing Vehicles */}
          {topVehicles.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Top Performing Vehicles</h2>
              <DataTable
                columns={[
                  {
                    key: "vehicle",
                    label: "Vehicle",
                    sortable: true,
                    render: (_, row) => `${row.brand} ${row.model}`
                  },
                  {
                    key: "registration_number",
                    label: "Registration",
                    sortable: true
                  },
                  {
                    key: "utilization_rate",
                    label: "Utilization",
                    render: (value) => (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${Math.min(value, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm">{value.toFixed(1)}%</span>
                      </div>
                    ),
                    sortable: true,
                  },
                  {
                    key: "total_revenue",
                    label: "Revenue",
                    render: (value) => `${formatCurrency(value)} DZD`,
                    sortable: true,
                  },
                ]}
                data={topVehicles}
              />
            </div>
          )}
          {/* Revenue & Payments Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-2">Total Payments</p>
              <p className="text-2xl font-semibold">{revenue.payment_count}</p>
              <p className="text-xs text-muted-foreground mt-2">Completed transactions</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-2">Monthly Revenue</p>
              <p className="text-2xl font-semibold">{formatCurrency(revenue.total)} DZD</p>
              <p className="text-xs text-accent mt-2">For selected period</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-2">Average Transaction</p>
              <p className="text-2xl font-semibold">{formatCurrency(revenue.average_transaction)} DZD</p>
              <p className="text-xs text-muted-foreground mt-2">Per rental</p>
            </div>
          </div>
          {/* Alerts & Notifications Section */}
          <div>
            {/* Add toggle for showDismissed */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Alerts & Notifications</h2>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showDismissed}
                  onChange={(e) => setShowDismissed(e.target.checked)}
                  className="rounded"
                />
                Show Dismissed
              </label>
              {/* NEW: Refetch button for testing */}
              <button
                onClick={refetchNotifications}
                className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Refresh Alerts
              </button>
            </div>
            <div className="space-y-3">
              {/* Existing fleet/customer alerts */}
              {fleet.maintenance_vehicles > 0 && (
                <div className="p-4 rounded-lg border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950 animate-in fade-in duration-200">
                  <p className="font-semibold text-sm">Vehicles in Maintenance</p>
                  <p className="text-sm text-muted-foreground">
                    {fleet.maintenance_vehicles} vehicle{fleet.maintenance_vehicles > 1 ? 's' : ''} currently under maintenance
                  </p>
                </div>
              )}
             
              {/* High/Critical Notifications Only */}
              {highNotifications.length > 0 ? (
                highNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 rounded-lg border-l-4 border-l-destructive bg-destructive/10 animate-in fade-in duration-300"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-destructive mb-1">
                          🚨 {notif.title}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notif.message}
                        </p>
                        {/* FIXED: Pass notif.type for pro render */}
                        {renderNotificationDetails(notif.data, notif.type)}
                        <p className="text-xs text-muted-foreground">
                          {new Date(notif.created_at).toLocaleString('fr-DZ', {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {/* Add Restore button if dismissed */}
                      <div className="flex flex-col gap-1 shrink-0">
                        {notif.dismissed && (
                          <button
                            onClick={() => handleRestore(notif.id)}
                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                            title="Restore"
                          >
                            Restore
                          </button>
                        )}
                        <button
                          onClick={() => handleDismiss(notif.id)}
                          className="p-1 text-destructive hover:bg-destructive/20 rounded"
                          title="Dismiss"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : notificationsError ? (
                <p className="text-sm text-destructive p-4 rounded-lg bg-destructive/5">
                  Failed to load notifications: {notificationsError}. <button onClick={refetchNotifications} className="underline">Retry</button>
                </p>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No alerts</p>
                  <p className="text-sm">All systems nominal.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}