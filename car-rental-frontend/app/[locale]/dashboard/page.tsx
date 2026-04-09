"use client"
import { useState, useEffect } from "react"
import { BarChart3, Car, CreditCard, Users, TrendingUp, AlertCircle, DollarSign, Bell, X, Link as LinkIcon } from "lucide-react"
import { KPICard } from "@/components/dashboard/kpi-card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { DataTable } from "@/components/dashboard/data-table"
import { useDashboard } from "@/hooks/useAnalytics"
import { useNotifications } from "@/hooks/useNotifications"
import toast from "react-hot-toast"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export default function DashboardPage() {
  const t = useTranslations("dashboardPage")
  const params = useParams()
  const locale = params.locale as string

  const [companyName, setCompanyName] = useState("Your Company")
  const [token, setToken] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
  )
  const [showDismissed, setShowDismissed] = useState(false)
  const [dateRange] = useState({ period: "month" as "today" | "week" | "month" | "quarter" | "year" })

  const { data: dashboardData, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useDashboard({ period: dateRange.period })
  const { data: notificationsData, loading: notificationsLoading, error: notificationsError, dismissNotification, restoreNotification, refetch: refetchNotifications } = useNotifications({ priority: "high", limit: 5, unread: true, showDismissed })

  const highNotifications = notificationsData?.notifications || []

  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/api/company/profile`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })
        .then((res) => {
          if (!res.ok) {
            if (res.status === 401) {
              toast.error("Session expired. Please log in again.")
              localStorage.removeItem("accessToken")
              setToken(null)
              if (typeof window !== "undefined") window.location.href = `/${locale}/login`
              return null
            }
            throw new Error(`HTTP ${res.status}`)
          }
          return res.json()
        })
        .then((responseData) => {
          if (responseData) {
            const company = responseData?.data?.company
            if (company) setCompanyName(company.name || "Your Company")
          }
        })
        .catch(() => toast.error("Failed to load company data"))
    }
  }, [token, locale])

  const renderNotificationDetails = (data: any, notifType?: string) => {
    if (!data || typeof data !== "object") return null

    if (data.alert_type?.startsWith("km_limit") || notifType?.startsWith("km_limit")) {
      return (
        <div className="text-xs bg-muted/50 p-3 rounded mb-2 space-y-2">
          <strong className="block font-medium text-xs uppercase tracking-wide mb-1">{t("keyDetails")}</strong>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {data.vehicle && <div className="flex items-center gap-1"><Car className="w-3 h-3 opacity-70" /><span className="font-medium">Vehicle:</span> {data.vehicle}</div>}
            {data.km_driven !== undefined && <div className="flex items-center gap-1"><TrendingUp className="w-3 h-3 opacity-70" /><span className="font-medium">Driven:</span> {data.km_driven} km</div>}
            {data.km_allowed !== undefined && <div className="flex items-center gap-1"><DollarSign className="w-3 h-3 opacity-70" /><span className="font-medium">Allowed:</span> {data.km_allowed} km</div>}
            {data.km_overage > 0 && <div className="flex items-center gap-1 text-destructive"><AlertCircle className="w-3 h-3" /><span className="font-medium">Overage:</span> +{data.km_overage} km</div>}
            {data.estimated_overage !== undefined && <div className="flex items-center gap-1 text-destructive"><CreditCard className="w-3 h-3" /><span className="font-medium">Charge:</span> {data.estimated_overage} DZD</div>}
            {data.contract_id && (
              <div className="col-span-2">
                <Link href={`/${locale}/dashboard/contracts/${data.contract_id}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <LinkIcon className="w-3 h-3" />{t("viewContract")}
                </Link>
              </div>
            )}
          </div>
          {data.km_overage > 0 && (
            <div className="mt-2 p-2 bg-destructive/10 rounded text-xs border border-destructive/20">
              <strong>{t("actionRequired")}:</strong> {t("actionRequiredDesc")}
            </div>
          )}
        </div>
      )
    }

    if (notifType?.startsWith("vehicle_limit")) {
      return (
        <div className="text-xs bg-muted/50 p-3 rounded mb-2 space-y-2">
          <strong className="block font-medium text-xs uppercase tracking-wide mb-1">{t("fleetStatusLabel")}</strong>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1"><Car className="w-3 h-3 opacity-70" /><span className="font-medium">Current:</span> {data.current}/{data.max}</div>
            <div className="flex items-center gap-1 text-destructive"><AlertCircle className="w-3 h-3" /><span className="font-medium">Remaining:</span> {data.remaining}</div>
            <div className="col-span-2">
              <Link href={`/${locale}/dashboard/billing`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <LinkIcon className="w-3 h-3" />{t("upgradeEnterprise")}
              </Link>
            </div>
          </div>
          {data.remaining <= 10 && (
            <div className="mt-2 p-2 bg-destructive/10 rounded text-xs border border-destructive/20">
              <strong>{t("urgent")}:</strong> {t("urgentDesc")}
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="text-xs bg-muted/50 p-3 rounded mb-2 space-y-1">
        <strong>{t("details")}:</strong>
        <ul className="list-disc list-inside text-xs mt-1 space-y-0.5">
          {Object.entries(data).map(([key, value]) => (
            <li key={key} className="capitalize">
              <span className="font-medium">{key.replace(/_/g, " ").toLowerCase()}:</span>{" "}
              {typeof value === "object" ? Object.entries(value ?? {}).map(([k, v]) => `${k}: ${v}`).join(", ") || "N/A" : String(value) || "N/A"}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-DZ", { style: "decimal", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)

  if (dashboardLoading || notificationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    )
  }

  if (dashboardError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("failedTitle")}</h2>
          <p className="text-muted-foreground mb-4">{dashboardError}</p>
          <button onClick={() => refetchDashboard()} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            {t("retry")}
          </button>
        </div>
      </div>
    )
  }

  const revenue = dashboardData?.revenue || { total: 0, average_transaction: 0, payment_count: 0 }
  const fleet = dashboardData?.fleet || { total_vehicles: 0, active_rentals: 0, available_vehicles: 0, maintenance_vehicles: 0, average_utilization: 0 }
  const customers = dashboardData?.customers || { total: 0, new: 0, repeat: 0, retention_rate: 0 }
  const topVehicles = dashboardData?.top_vehicles || []

  return (
    <ProtectedRoute requiredPermissions={["view_dashboard"]}>
      <div className="relative min-h-screen">
        {highNotifications.length > 0 && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg border border-destructive/50 animate-in slide-in-from-top-2 duration-300">
            <Bell className="w-5 h-5" />
            <span className="font-semibold text-sm max-w-64">🚨 {highNotifications[0].title}</span>
            <button onClick={() => dismissNotification(highNotifications[0].id)} className="ml-2 p-1 hover:bg-destructive/20 rounded" title={t("dismiss")}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">{t("welcomeBack", { company: companyName })}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label={t("totalRevenue")} value={formatCurrency(revenue.total)} suffix="DZD" icon={<DollarSign className="w-6 h-6" />} />
            <KPICard label={t("activeRentals")} value={fleet.active_rentals} icon={<Car className="w-6 h-6" />} />
            <KPICard label={t("availableVehicles")} value={fleet.available_vehicles} icon={<Car className="w-6 h-6" />} />
            <KPICard label={t("totalCustomers")} value={customers.total} icon={<Users className="w-6 h-6" />} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label={t("avgTransaction")} value={formatCurrency(revenue.average_transaction)} suffix="DZD" icon={<CreditCard className="w-6 h-6" />} />
            <KPICard label={t("fleetUtilization")} value={`${fleet.average_utilization.toFixed(1)}%`} icon={<TrendingUp className="w-6 h-6" />} />
            <KPICard label={t("maintenanceVehicles")} value={fleet.maintenance_vehicles} icon={<AlertCircle className="w-6 h-6" />} />
            <KPICard label={t("retentionRate")} value={`${customers.retention_rate.toFixed(1)}%`} icon={<Users className="w-6 h-6" />} />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">{t("quickActions")}</h2>
            <QuickActions actions={[
              { label: t("newRental"),         href: `/${locale}/dashboard/contracts/new` },
              { label: t("addVehicle"),        href: `/${locale}/dashboard/vehicles/new` },
              { label: t("registerCustomer"),  href: `/${locale}/dashboard/customers/new` },
              { label: t("viewAnalytics"),     href: `/${locale}/dashboard/analytics` },
            ]} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Car className="w-5 h-5" />{t("fleetStatus")}</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t("totalVehicles")}</span>
                  <span className="font-semibold text-lg">{fleet.total_vehicles}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full flex">
                    <div className="bg-green-500" style={{ width: `${(fleet.available_vehicles / fleet.total_vehicles || 0) * 100}%` }} />
                    <div className="bg-blue-500" style={{ width: `${(fleet.active_rentals / fleet.total_vehicles || 0) * 100}%` }} />
                    <div className="bg-amber-500" style={{ width: `${(fleet.maintenance_vehicles / fleet.total_vehicles || 0) * 100}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500" /><span>{t("available")} ({fleet.available_vehicles})</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500" /><span>{t("rented")} ({fleet.active_rentals})</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500" /><span>{t("maintenance")} ({fleet.maintenance_vehicles})</span></div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5" />{t("customerInsights")}</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t("newCustomers")}</span>
                  <span className="font-semibold text-lg text-green-600">{customers.new}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t("repeatCustomers")}</span>
                  <span className="font-semibold text-lg text-blue-600">{customers.repeat}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t("retentionRate")}</span>
                  <span className="font-semibold text-lg text-accent">{customers.retention_rate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {topVehicles.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">{t("topVehicles")}</h2>
              <DataTable
                columns={[
                  { key: "vehicle", label: t("vehicle"), sortable: true, render: (_, row) => `${row.brand} ${row.model}` },
                  { key: "registration_number", label: t("registration"), sortable: true },
                  { key: "utilization_rate", label: t("utilization"), sortable: true, render: (value) => (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(value, 100)}%` }} /></div>
                      <span className="text-sm">{value.toFixed(1)}%</span>
                    </div>
                  )},
                  { key: "total_revenue", label: t("revenue"), sortable: true, render: (value) => `${formatCurrency(value)} DZD` },
                ]}
                data={topVehicles}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-2">{t("totalPayments")}</p>
              <p className="text-2xl font-semibold">{revenue.payment_count}</p>
              <p className="text-xs text-muted-foreground mt-2">{t("completedTransactions")}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-2">{t("monthlyRevenue")}</p>
              <p className="text-2xl font-semibold">{formatCurrency(revenue.total)} DZD</p>
              <p className="text-xs text-accent mt-2">{t("forSelectedPeriod")}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-2">{t("avgTransaction")}</p>
              <p className="text-2xl font-semibold">{formatCurrency(revenue.average_transaction)} DZD</p>
              <p className="text-xs text-muted-foreground mt-2">{t("perRental")}</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{t("alerts")}</h2>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showDismissed} onChange={(e) => setShowDismissed(e.target.checked)} className="rounded" />
                {t("showDismissed")}
              </label>
              <button onClick={refetchNotifications} className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">
                {t("refreshAlerts")}
              </button>
            </div>

            <div className="space-y-3">
              {fleet.maintenance_vehicles > 0 && (
                <div className="p-4 rounded-lg border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950 animate-in fade-in duration-200">
                  <p className="font-semibold text-sm">{t("vehiclesInMaintenance")}</p>
                  <p className="text-sm text-muted-foreground">
                    {fleet.maintenance_vehicles > 1
                      ? t("maintenanceDescPlural").replace("{count}", String(fleet.maintenance_vehicles))
                      : t("maintenanceDesc").replace("{count}", String(fleet.maintenance_vehicles))}
                  </p>
                </div>
              )}

              {highNotifications.length > 0 ? (
                highNotifications.map((notif) => (
                  <div key={notif.id} className="p-4 rounded-lg border-l-4 border-l-destructive bg-destructive/10 animate-in fade-in duration-300">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-destructive mb-1">🚨 {notif.title}</p>
                        <p className="text-sm text-muted-foreground mb-2">{notif.message}</p>
                        {renderNotificationDetails(notif.data, notif.type)}
                        <p className="text-xs text-muted-foreground">
                          {new Date(notif.created_at).toLocaleString("fr-DZ", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {notif.dismissed && (
                          <button onClick={() => restoreNotification(notif.id)} className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
                            {t("restore")}
                          </button>
                        )}
                        <button onClick={() => dismissNotification(notif.id)} className="p-1 text-destructive hover:bg-destructive/20 rounded" title={t("dismiss")}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : notificationsError ? (
                <p className="text-sm text-destructive p-4 rounded-lg bg-destructive/5">
                  {t("failedNotifications")}: {notificationsError}.{" "}
                  <button onClick={refetchNotifications} className="underline">{t("retry")}</button>
                </p>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t("noAlerts")}</p>
                  <p className="text-sm">{t("allNominal")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}