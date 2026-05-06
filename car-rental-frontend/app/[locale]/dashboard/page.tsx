"use client"
import { useState, useEffect } from "react"
import {
  BarChart3, Car, CreditCard, Users, TrendingUp,
  AlertCircle, DollarSign, Bell, X, Link as LinkIcon,
} from "lucide-react"
import { KPICard }      from "@/components/dashboard/kpi-card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { DataTable }    from "@/components/dashboard/data-table"
import { useDashboard } from "@/hooks/useAnalytics"
import { useNotifications } from "@/hooks/useNotifications"
import toast            from "react-hot-toast"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import Link             from "next/link"
import { useTranslations } from "next-intl"
import { useParams }    from "next/navigation"

/* ─── tokens ──────────────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const G_DIM   = "rgba(34,197,94,0.10)"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

/* ─── small helpers ───────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`,
      borderRadius: 16, padding: "22px 24px", fontFamily: FONT, color: "#fff",
      ...style,
    }}>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14, fontFamily: FONT }}>
      {children}
    </p>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const t      = useTranslations("dashboardPage")
  const params = useParams()
  const locale = params.locale as string

  const [companyName, setCompanyName] = useState("Your Company")
  const [token, setToken] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
  )
  const [showDismissed, setShowDismissed] = useState(false)
  const [dateRange] = useState({ period: "month" as "today" | "week" | "month" | "quarter" | "year" })

  const { data: dashboardData, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } =
    useDashboard({ period: dateRange.period })
  const { data: notificationsData, loading: notificationsLoading, error: notificationsError,
    dismissNotification, restoreNotification, refetch: refetchNotifications } =
    useNotifications({ priority: "high", limit: 5, unread: true, showDismissed })

  const highNotifications = notificationsData?.notifications || []

  /* ── unchanged: fetch company name ── */
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

  /* ── unchanged: notification detail renderer ── */
  const renderNotificationDetails = (data: any, notifType?: string) => {
    if (!data || typeof data !== "object") return null

    const detailBox = (children: React.ReactNode) => (
      <div style={{ fontSize: 12, color: "#fff", background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
        {children}
      </div>
    )

    if (data.alert_type?.startsWith("km_limit") || notifType?.startsWith("km_limit")) {
      return detailBox(
        <>
          <strong style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>{t("keyDetails")}</strong>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
            {data.vehicle && <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Car size={11} style={{ opacity: 0.6 }} /><span style={{ fontWeight: 600 }}>Vehicle:</span>&nbsp;{data.vehicle}</div>}
            {data.km_driven !== undefined && <div style={{ display: "flex", alignItems: "center", gap: 5 }}><TrendingUp size={11} style={{ opacity: 0.6 }} /><span style={{ fontWeight: 600 }}>Driven:</span>&nbsp;{data.km_driven} km</div>}
            {data.km_allowed !== undefined && <div style={{ display: "flex", alignItems: "center", gap: 5 }}><DollarSign size={11} style={{ opacity: 0.6 }} /><span style={{ fontWeight: 600 }}>Allowed:</span>&nbsp;{data.km_allowed} km</div>}
            {data.km_overage > 0 && <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#F87171" }}><AlertCircle size={11} /><span style={{ fontWeight: 600 }}>Overage:</span>&nbsp;+{data.km_overage} km</div>}
            {data.estimated_overage !== undefined && <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#F87171" }}><CreditCard size={11} /><span style={{ fontWeight: 600 }}>Charge:</span>&nbsp;{data.estimated_overage} DZD</div>}
            {data.contract_id && (
              <div style={{ gridColumn: "1/-1" }}>
                <Link href={`/${locale}/dashboard/contracts/${data.contract_id}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: GREEN, textDecoration: "none" }}>
                  <LinkIcon size={10} />{t("viewContract")}
                </Link>
              </div>
            )}
          </div>
          {data.km_overage > 0 && (
            <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)", fontSize: 11 }}>
              <strong>{t("actionRequired")}:</strong> {t("actionRequiredDesc")}
            </div>
          )}
        </>
      )
    }

    if (notifType?.startsWith("vehicle_limit")) {
      return detailBox(
        <>
          <strong style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>{t("fleetStatusLabel")}</strong>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Car size={11} style={{ opacity: 0.6 }} /><span style={{ fontWeight: 600 }}>Current:</span>&nbsp;{data.current}/{data.max}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#F87171" }}><AlertCircle size={11} /><span style={{ fontWeight: 600 }}>Remaining:</span>&nbsp;{data.remaining}</div>
            <div style={{ gridColumn: "1/-1" }}>
              <Link href={`/${locale}/dashboard/billing`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: GREEN, textDecoration: "none" }}>
                <LinkIcon size={10} />{t("upgradeEnterprise")}
              </Link>
            </div>
          </div>
          {data.remaining <= 10 && (
            <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)", fontSize: 11 }}>
              <strong>{t("urgent")}:</strong> {t("urgentDesc")}
            </div>
          )}
        </>
      )
    }

    return detailBox(
      <>
        <strong style={{ display: "block", marginBottom: 6 }}>{t("details")}:</strong>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          {Object.entries(data).map(([key, value]) => (
            <li key={key} style={{ fontSize: 11, textTransform: "capitalize" }}>
              <span style={{ fontWeight: 600 }}>{key.replace(/_/g, " ").toLowerCase()}:</span>{" "}
              {typeof value === "object"
                ? Object.entries(value ?? {}).map(([k, v]) => `${k}: ${v}`).join(", ") || "N/A"
                : String(value) || "N/A"}
            </li>
          ))}
        </ul>
      </>
    )
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-DZ", { style: "decimal", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)

  /* ── loading ── */
  if (dashboardLoading || notificationsLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", fontFamily: FONT, color: "#fff" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 42, height: 42, border: `3px solid ${GREEN}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#9CA3AF", fontSize: 14 }}>{t("loading")}</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  /* ── error ── */
  if (dashboardError) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", fontFamily: FONT, color: "#fff" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <AlertCircle size={48} color="#F87171" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#fff" }}>{t("failedTitle")}</h2>
          <p style={{ color: "#9CA3AF", fontSize: 14, marginBottom: 20 }}>{dashboardError}</p>
          <button
            onClick={() => refetchDashboard()}
            style={{ padding: "10px 22px", background: GREEN, border: "none", borderRadius: 10, color: "#fff", fontFamily: FONT, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            {t("retry")}
          </button>
        </div>
      </div>
    )
  }

  const revenue    = dashboardData?.revenue    || { total: 0, average_transaction: 0, payment_count: 0 }
  const fleet      = dashboardData?.fleet      || { total_vehicles: 0, active_rentals: 0, available_vehicles: 0, maintenance_vehicles: 0, average_utilization: 0 }
  const customers  = dashboardData?.customers  || { total: 0, new: 0, repeat: 0, retention_rate: 0 }
  const topVehicles = dashboardData?.top_vehicles || []

  return (
    <ProtectedRoute requiredPermissions={["view_dashboard"]}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:none; } }
      `}</style>

      <div style={{ position: "relative", minHeight: "100vh", fontFamily: FONT, color: "#fff" }}>

        {/* ── floating alert toast ── (logic unchanged) */}
        {highNotifications.length > 0 && (
          <div style={{
            position: "fixed", top: 16, right: 16, zIndex: 50,
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(239,68,68,0.12)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(239,68,68,0.3)",
            padding: "10px 16px", borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            animation: "slideDown 0.3s ease",
          }}>
            <Bell size={15} color="#F87171" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#FCA5A5", maxWidth: 260 }}>
              🚨 {highNotifications[0].title}
            </span>
            <button
              onClick={() => dismissNotification(highNotifications[0].id)}
              title={t("dismiss")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 2, marginLeft: 4, display: "flex" }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

          {/* ── header ── */}
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.035em", marginBottom: 6, color: "#fff" }}>Dashboard</h1>
            <p style={{ color: "#9CA3AF", fontSize: 14 }}>{t("welcomeBack", { company: companyName })}</p>
          </div>

          {/* ── KPI row 1 ── */}
          <div>
            <SectionLabel>Revenue & Fleet</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
              <KPICard label={t("totalRevenue")}       value={formatCurrency(revenue.total)}                        suffix="DZD" icon={<DollarSign size={18} />} />
              <KPICard label={t("activeRentals")}      value={fleet.active_rentals}                                              icon={<Car size={18} />} />
              <KPICard label={t("availableVehicles")}  value={fleet.available_vehicles}                                           icon={<Car size={18} />} />
              <KPICard label={t("totalCustomers")}     value={customers.total}                                                    icon={<Users size={18} />} />
            </div>
          </div>

          {/* ── KPI row 2 ── */}
          <div>
            <SectionLabel>Performance</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
              <KPICard label={t("avgTransaction")}       value={formatCurrency(revenue.average_transaction)} suffix="DZD" icon={<CreditCard size={18} />} />
              <KPICard label={t("fleetUtilization")}     value={`${fleet.average_utilization.toFixed(1)}%`}               icon={<TrendingUp size={18} />} />
              <KPICard label={t("maintenanceVehicles")}  value={fleet.maintenance_vehicles}                                icon={<AlertCircle size={18} />} />
              <KPICard label={t("retentionRate")}        value={`${customers.retention_rate.toFixed(1)}%`}                icon={<Users size={18} />} />
            </div>
          </div>

          {/* ── quick actions ── */}
          <div>
            <SectionLabel>{t("quickActions")}</SectionLabel>
            <QuickActions actions={[
              { label: t("newRental"),        href: `/${locale}/dashboard/contracts/new` },
              { label: t("addVehicle"),       href: `/${locale}/dashboard/vehicles/new` },
              { label: t("registerCustomer"), href: `/${locale}/dashboard/customers/new` },
              { label: t("viewAnalytics"),    href: `/${locale}/dashboard/analytics` },
            ]} />
          </div>

          {/* ── fleet status + customer insights ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>

            {/* fleet status */}
            <Card>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <Car size={15} color={GREEN} /> {t("fleetStatus")}
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: "#9CA3AF" }}>{t("totalVehicles")}</span>
                <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.04em", color: "#fff" }}>{fleet.total_vehicles}</span>
              </div>
              {/* progress bar */}
              <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 14 }}>
                <div style={{ height: "100%", display: "flex" }}>
                  <div style={{ background: "#22C55E", width: `${(fleet.available_vehicles / (fleet.total_vehicles || 1)) * 100}%`, transition: "width 0.6s ease" }} />
                  <div style={{ background: "#60A5FA", width: `${(fleet.active_rentals    / (fleet.total_vehicles || 1)) * 100}%`, transition: "width 0.6s ease" }} />
                  <div style={{ background: "#F59E0B", width: `${(fleet.maintenance_vehicles / (fleet.total_vehicles || 1)) * 100}%`, transition: "width 0.6s ease" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                {[
                  { color: "#22C55E", label: t("available"),   val: fleet.available_vehicles },
                  { color: "#60A5FA", label: t("rented"),      val: fleet.active_rentals },
                  { color: "#F59E0B", label: t("maintenance"), val: fleet.maintenance_vehicles },
                ].map(({ color, label, val }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#9CA3AF" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    {label} ({val})
                  </div>
                ))}
              </div>
            </Card>

            {/* customer insights */}
            <Card>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <Users size={15} color={GREEN} /> {t("customerInsights")}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: t("newCustomers"),    val: customers.new,                          color: "#22C55E" },
                  { label: t("repeatCustomers"), val: customers.repeat,                       color: "#60A5FA" },
                  { label: t("retentionRate"),   val: `${customers.retention_rate.toFixed(1)}%`, color: GREEN },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#9CA3AF" }}>{label}</span>
                    <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.04em", color }}>{val}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── top vehicles table ── */}
          {topVehicles.length > 0 && (
            <div>
              <SectionLabel>{t("topVehicles")}</SectionLabel>
              <Card style={{ padding: 0, overflow: "hidden" }}>
                <DataTable
                  columns={[
                    { key: "vehicle",             label: t("vehicle"),      sortable: true, render: (_: any, row: any) => `${row.brand} ${row.model}` },
                    { key: "registration_number", label: t("registration"), sortable: true },
                    { key: "utilization_rate",    label: t("utilization"),  sortable: true, render: (value: number) => (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 60, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.08)" }}>
                          <div style={{ height: "100%", borderRadius: 99, background: GREEN, width: `${Math.min(value, 100)}%` }} />
                        </div>
                        <span style={{ fontSize: 12, color: "#fff" }}>{value.toFixed(1)}%</span>
                      </div>
                    )},
                    { key: "total_revenue", label: t("revenue"), sortable: true, render: (value: number) => `${formatCurrency(value)} DZD` },
                  ]}
                  data={topVehicles}
                />
              </Card>
            </div>
          )}

          {/* ── revenue summary cards ── */}
          <div>
            <SectionLabel>Financials</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
              {[
                { label: t("totalPayments"),    val: revenue.payment_count,                           note: t("completedTransactions"), noteColor: "#6B7280" },
                { label: t("monthlyRevenue"),   val: `${formatCurrency(revenue.total)} DZD`,           note: t("forSelectedPeriod"),      noteColor: GREEN },
                { label: t("avgTransaction"),   val: `${formatCurrency(revenue.average_transaction)} DZD`, note: t("perRental"),          noteColor: "#6B7280" },
              ].map(({ label, val, note, noteColor }) => (
                <Card key={label} style={{ padding: "20px 22px" }}>
                  <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>{label}</p>
                  <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 6, color: "#fff" }}>{val}</p>
                  <p style={{ fontSize: 11, color: noteColor }}>{note}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* ── alerts ── */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <SectionLabel style={{ margin: 0 } as any}>{t("alerts")}</SectionLabel>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#9CA3AF", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={showDismissed}
                    onChange={(e) => setShowDismissed(e.target.checked)}
                    style={{ accentColor: GREEN }}
                  />
                  {t("showDismissed")}
                </label>
                <button
                  onClick={refetchNotifications}
                  style={{
                    padding: "5px 12px", background: G_DIM, border: "1px solid rgba(34,197,94,0.2)",
                    borderRadius: 8, color: GREEN, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
                  }}
                >
                  {t("refreshAlerts")}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* maintenance warning */}
              {fleet.maintenance_vehicles > 0 && (
                <div style={{
                  padding: "14px 18px", borderRadius: 12,
                  background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)",
                  borderLeft: "3px solid #F59E0B",
                  animation: "fadeIn 0.2s ease",
                }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#FCD34D", marginBottom: 4 }}>{t("vehiclesInMaintenance")}</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>
                    {fleet.maintenance_vehicles > 1
                      ? t("maintenanceDescPlural").replace("{count}", String(fleet.maintenance_vehicles))
                      : t("maintenanceDesc").replace("{count}", String(fleet.maintenance_vehicles))}
                  </p>
                </div>
              )}

              {/* high-priority notifications (logic unchanged) */}
              {highNotifications.length > 0 ? (
                highNotifications.map((notif) => (
                  <div key={notif.id} style={{
                    padding: "14px 18px", borderRadius: 12,
                    background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
                    borderLeft: "3px solid #F87171",
                    animation: "fadeIn 0.3s ease",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#FCA5A5", marginBottom: 6 }}>🚨 {notif.title}</p>
                        <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 10 }}>{notif.message}</p>
                        {renderNotificationDetails(notif.data, notif.type)}
                        <p style={{ fontSize: 11, color: "#6B7280" }}>
                          {new Date(notif.created_at).toLocaleString("fr-DZ", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                        {notif.dismissed && (
                          <button
                            onClick={() => restoreNotification(notif.id)}
                            style={{ padding: "4px 10px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 7, color: GREEN, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}
                          >
                            {t("restore")}
                          </button>
                        )}
                        <button
                          onClick={() => dismissNotification(notif.id)}
                          title={t("dismiss")}
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 5, background: "transparent", border: "none", cursor: "pointer", color: "#F87171", borderRadius: 6 }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : notificationsError ? (
                <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", fontSize: 13, color: "#FCA5A5" }}>
                  {t("failedNotifications")}: {notificationsError}.{" "}
                  <button onClick={refetchNotifications} style={{ background: "none", border: "none", color: GREEN, cursor: "pointer", fontSize: 13, textDecoration: "underline", fontFamily: FONT }}>
                    {t("retry")}
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <AlertCircle size={36} color="#4B5563" style={{ margin: "0 auto 12px" }} />
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#9CA3AF" }}>{t("noAlerts")}</p>
                  <p style={{ fontSize: 12, marginTop: 4, color: "#6B7280" }}>{t("allNominal")}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  )
}